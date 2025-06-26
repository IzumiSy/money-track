import { describe, it, expect } from "vitest";
import { convertIncomeToIncomeSource } from "./source";
import { Income } from "@/contexts/IncomeContext";
import { YearMonthDuration } from "@/types/YearMonth";

describe("convertIncomeToIncomeSource", () => {
  describe("サイクル設定なしの場合", () => {
    it("毎月収入が発生する", () => {
      const income: Income = {
        id: "1",
        name: "給与",
        monthlyAmount: 300000,
        color: "#10B981",
        startYearMonth: YearMonthDuration.from(1, 1), // 1年目1月から
      };

      const source = convertIncomeToIncomeSource(income);

      // 1年目1月から3月まで毎月発生
      expect(source.calculate(1, 1)).toEqual({ income: 300000, expense: 0 });
      expect(source.calculate(1, 2)).toEqual({ income: 300000, expense: 0 });
      expect(source.calculate(1, 3)).toEqual({ income: 300000, expense: 0 });
    });
  });

  describe("月単位のサイクル設定", () => {
    it("3ヶ月ごとに収入が発生する", () => {
      const income: Income = {
        id: "1",
        name: "ボーナス",
        monthlyAmount: 500000,
        color: "#10B981",
        startYearMonth: YearMonthDuration.from(1, 1), // 1年目1月から
        cycleSetting: {
          enabled: true,
          interval: 3,
          unit: "month",
        },
      };

      const source = convertIncomeToIncomeSource(income);

      // 開始月（1年目1月）から3ヶ月ごと
      expect(source.calculate(1, 1)).toEqual({ income: 500000, expense: 0 }); // 0ヶ月目
      expect(source.calculate(1, 2)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(1, 3)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(1, 4)).toEqual({ income: 500000, expense: 0 }); // 3ヶ月目
      expect(source.calculate(1, 5)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(1, 6)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(1, 7)).toEqual({ income: 500000, expense: 0 }); // 6ヶ月目
    });

    it("隔月（2ヶ月ごと）に収入が発生する", () => {
      const income: Income = {
        id: "1",
        name: "副業収入",
        monthlyAmount: 100000,
        color: "#10B981",
        startYearMonth: YearMonthDuration.from(1, 3), // 1年目3月から
        cycleSetting: {
          enabled: true,
          interval: 2,
          unit: "month",
        },
      };

      const source = convertIncomeToIncomeSource(income);

      // 1年目3月から隔月
      expect(source.calculate(1, 1)).toEqual({ income: 0, expense: 0 }); // 開始前
      expect(source.calculate(1, 2)).toEqual({ income: 0, expense: 0 }); // 開始前
      expect(source.calculate(1, 3)).toEqual({ income: 100000, expense: 0 }); // 0ヶ月目
      expect(source.calculate(1, 4)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(1, 5)).toEqual({ income: 100000, expense: 0 }); // 2ヶ月目
      expect(source.calculate(1, 6)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(1, 7)).toEqual({ income: 100000, expense: 0 }); // 4ヶ月目
    });
  });

  describe("年単位のサイクル設定", () => {
    it("毎年収入が発生する", () => {
      const income: Income = {
        id: "1",
        name: "年次ボーナス",
        monthlyAmount: 1000000,
        color: "#10B981",
        startYearMonth: YearMonthDuration.from(1, 6), // 1年目6月から
        cycleSetting: {
          enabled: true,
          interval: 1,
          unit: "year",
        },
      };

      const source = convertIncomeToIncomeSource(income);

      // 1年目6月から毎年同月
      expect(source.calculate(1, 5)).toEqual({ income: 0, expense: 0 }); // 開始前
      expect(source.calculate(1, 6)).toEqual({
        income: 1000000,
        expense: 0,
      }); // 0ヶ月目
      expect(source.calculate(1, 7)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(2, 5)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(2, 6)).toEqual({
        income: 1000000,
        expense: 0,
      }); // 12ヶ月目
      expect(source.calculate(2, 7)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(3, 6)).toEqual({
        income: 1000000,
        expense: 0,
      }); // 24ヶ月目
    });

    it("2年ごとに収入が発生する", () => {
      const income: Income = {
        id: "1",
        name: "特別報酬",
        monthlyAmount: 2000000,
        color: "#10B981",
        startYearMonth: YearMonthDuration.from(1, 12), // 1年目12月から
        cycleSetting: {
          enabled: true,
          interval: 2,
          unit: "year",
        },
      };

      const source = convertIncomeToIncomeSource(income);

      // 1年目12月から2年ごと
      expect(source.calculate(1, 12)).toEqual({
        income: 2000000,
        expense: 0,
      }); // 0ヶ月目
      expect(source.calculate(2, 12)).toEqual({ income: 0, expense: 0 }); // 12ヶ月目
      expect(source.calculate(3, 12)).toEqual({
        income: 2000000,
        expense: 0,
      }); // 24ヶ月目
      expect(source.calculate(4, 12)).toEqual({ income: 0, expense: 0 }); // 36ヶ月目
      expect(source.calculate(5, 12)).toEqual({
        income: 2000000,
        expense: 0,
      }); // 48ヶ月目
    });
  });

  describe("期間とサイクル設定の組み合わせ", () => {
    it("期間内でサイクル設定に従って収入が発生する", () => {
      const income: Income = {
        id: "1",
        name: "期間限定収入",
        monthlyAmount: 150000,
        color: "#10B981",
        startYearMonth: YearMonthDuration.from(1, 1), // 1年目1月から
        endYearMonth: YearMonthDuration.from(1, 12), // 1年目12月まで
        cycleSetting: {
          enabled: true,
          interval: 3,
          unit: "month",
        },
      };

      const source = convertIncomeToIncomeSource(income);

      // 1年目1月から12月まで、3ヶ月ごと
      expect(source.calculate(1, 1)).toEqual({ income: 150000, expense: 0 }); // 0ヶ月目
      expect(source.calculate(1, 4)).toEqual({ income: 150000, expense: 0 }); // 3ヶ月目
      expect(source.calculate(1, 7)).toEqual({ income: 150000, expense: 0 }); // 6ヶ月目
      expect(source.calculate(1, 10)).toEqual({
        income: 150000,
        expense: 0,
      }); // 9ヶ月目
      expect(source.calculate(2, 1)).toEqual({ income: 0, expense: 0 }); // 期間外
    });
  });

  describe("サイクル設定が無効の場合", () => {
    it("毎月収入が発生する", () => {
      const income: Income = {
        id: "1",
        name: "通常収入",
        monthlyAmount: 250000,
        color: "#10B981",
        startYearMonth: YearMonthDuration.from(1, 1), // 1年目1月から
        cycleSetting: {
          enabled: false,
          interval: 3,
          unit: "month",
        },
      };

      const source = convertIncomeToIncomeSource(income);

      // サイクル設定が無効なので毎月発生
      expect(source.calculate(1, 1)).toEqual({ income: 250000, expense: 0 });
      expect(source.calculate(1, 2)).toEqual({ income: 250000, expense: 0 });
      expect(source.calculate(1, 3)).toEqual({ income: 250000, expense: 0 });
      expect(source.calculate(1, 4)).toEqual({ income: 250000, expense: 0 });
    });
  });
});
