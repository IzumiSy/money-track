import { GroupedAsset } from "@/domains/group/types";
import { CalculatorSource, CashFlowChange } from "@/domains/shared";

/**
 * 資産の内部状態を管理するクラス
 */
class AssetSourceImpl implements CalculatorSource {
  public readonly id: string;
  public readonly name: string;
  public readonly type = "asset";

  private readonly asset: GroupedAsset;
  private readonly monthlyReturnRate: number;
  private balanceCache: Map<number, number> = new Map();

  constructor(asset: GroupedAsset) {
    this.id = asset.id;
    this.name = asset.name;
    this.asset = asset;
    // 年利を月利に変換（複利計算用）
    this.monthlyReturnRate = Math.pow(1 + asset.returnRate / 100, 1 / 12) - 1;
  }

  calculate(monthIndex: number): CashFlowChange {
    // 初月（monthIndex === 0）の場合は初期額を収入として含める
    const initialAmount = monthIndex === 0 ? this.asset.baseAmount : 0;

    // 利息収入を計算（初月は利息なし）
    let interestIncome = 0;
    if (monthIndex > 0) {
      // 前月の残高を取得
      const previousBalance = this.getBalanceAt(monthIndex - 1);
      interestIncome = previousBalance * this.monthlyReturnRate;
    }

    // 積立・引き出しを計算
    const contribution = this.getContributionAt(monthIndex);
    const withdrawal = this.getWithdrawalAt(monthIndex);

    // CashFlowChangeとして返す
    // 初期額、利息と積立は収入、引き出しは支出として扱う
    return {
      income: initialAmount + interestIncome + contribution,
      expense: withdrawal,
    };
  }

  getMetadata() {
    return {
      color: this.asset.color,
      originalAsset: this.asset,
      assetType: "investment",
      returnRate: this.asset.returnRate,
    };
  }

  /**
   * 指定月の実際の資産残高を取得（公開メソッド）
   */
  getBalance(monthIndex: number): number {
    return this.getBalanceAt(monthIndex);
  }

  /**
   * 指定月の残高を取得（キャッシュがなければ計算）
   */
  private getBalanceAt(monthIndex: number): number {
    if (this.balanceCache.has(monthIndex)) {
      return this.balanceCache.get(monthIndex)!;
    }

    // 0月目から順番に計算してキャッシュ
    this.calculateAndCacheUpTo(monthIndex);
    return this.balanceCache.get(monthIndex)!;
  }

  /**
   * 指定月までの残高を計算してキャッシュ
   */
  private calculateAndCacheUpTo(targetMonth: number) {
    let lastCachedMonth = -1;

    // 既にキャッシュされている最後の月を探す
    for (let i = targetMonth; i >= 0; i--) {
      if (this.balanceCache.has(i)) {
        lastCachedMonth = i;
        break;
      }
    }

    // 初期残高から開始
    let balance =
      lastCachedMonth === -1
        ? this.asset.baseAmount
        : this.balanceCache.get(lastCachedMonth)!;

    // 0月目の残高をキャッシュ（初期額 + 0月目の積立 - 0月目の引き出し）
    if (lastCachedMonth === -1) {
      const month0Contribution = this.getContributionAt(0);
      const month0Withdrawal = this.getWithdrawalAt(0);
      balance = balance + month0Contribution - month0Withdrawal;
      this.balanceCache.set(0, balance);
      lastCachedMonth = 0;
    }

    // lastCachedMonth + 1 から targetMonth まで計算
    for (let month = lastCachedMonth + 1; month <= targetMonth; month++) {
      // 前月末の残高に利息を加算
      balance = balance * (1 + this.monthlyReturnRate);

      // 積立を加算
      balance += this.getContributionAt(month);

      // 引き出しを減算
      balance -= this.getWithdrawalAt(month);

      // キャッシュに保存
      this.balanceCache.set(month, balance);
    }
  }

  /**
   * 指定月の積立額を取得
   */
  private getContributionAt(monthIndex: number): number {
    let totalContribution = 0;

    for (const option of this.asset.contributionOptions) {
      // 開始月と終了月を計算（0ベースのインデックスに変換）
      const startMonth = (option.startYear - 1) * 12 + (option.startMonth - 1);
      const endMonth = (option.endYear - 1) * 12 + (option.endMonth - 1);

      if (monthIndex >= startMonth && monthIndex <= endMonth) {
        totalContribution += option.monthlyAmount;
      }
    }

    return totalContribution;
  }

  /**
   * 指定月の引き出し額を取得
   */
  private getWithdrawalAt(monthIndex: number): number {
    let totalWithdrawal = 0;

    for (const option of this.asset.withdrawalOptions) {
      // 開始月と終了月を計算（0ベースのインデックスに変換）
      const startMonth = (option.startYear - 1) * 12 + (option.startMonth - 1);
      const endMonth = (option.endYear - 1) * 12 + (option.endMonth - 1);

      if (monthIndex >= startMonth && monthIndex <= endMonth) {
        totalWithdrawal += option.monthlyAmount;
      }
    }

    return totalWithdrawal;
  }
}

/**
 * GroupedAsset型をCalculatorSource型に変換
 */
export function convertAssetToAssetSource(
  asset: GroupedAsset
): CalculatorSource {
  return new AssetSourceImpl(asset);
}
