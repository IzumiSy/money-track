import { describe, it, expect } from "vitest";
import { convertExpenseToExpenseSource } from "./source";
import { Expense } from "@/contexts/ExpensesContext";
import { YearMonthDuration } from "@/types/YearMonth";

describe("convertExpenseToExpenseSource", () => {
  describe("サイクル設定なしの場合", () => {
    it("毎月支出が発生する", () => {
      const expense: Expense = {
        id: "1",
        name: "家賃",
        monthlyAmount: 100000,
        color: "#EF4444",
        startYearMonth: YearMonthDuration.from(1, 1), // 1年目1月から
      };

      const source = convertExpenseToExpenseSource(expense);

      // 1年目1月から3月まで毎月発生
      expect(source.calculate(1, 1)).toEqual({ income: 0, expense: 100000 });
      expect(source.calculate(1, 2)).toEqual({ income: 0, expense: 100000 });
      expect(source.calculate(1, 3)).toEqual({ income: 0, expense: 100000 });
    });
  });

  describe("月単位のサイクル設定", () => {
    it("3ヶ月ごとに支出が発生する", () => {
      const expense: Expense = {
        id: "1",
        name: "保険料",
        monthlyAmount: 30000,
        color: "#EF4444",
        startYearMonth: YearMonthDuration.from(1, 1), // 1年目1月から
        cycleSetting: {
          enabled: true,
          interval: 3,
          unit: "month",
        },
      };

      const source = convertExpenseToExpenseSource(expense);

      // 開始月（1年目1月）から3ヶ月ごと
      expect(source.calculate(1, 1)).toEqual({ income: 0, expense: 30000 }); // 0ヶ月目
      expect(source.calculate(1, 2)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(1, 3)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(1, 4)).toEqual({ income: 0, expense: 30000 }); // 3ヶ月目
      expect(source.calculate(1, 5)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(1, 6)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(1, 7)).toEqual({ income: 0, expense: 30000 }); // 6ヶ月目
    });

    it("隔月（2ヶ月ごと）に支出が発生する", () => {
      const expense: Expense = {
        id: "1",
        name: "美容院",
        monthlyAmount: 8000,
        color: "#EF4444",
        startYearMonth: YearMonthDuration.from(1, 2), // 1年目2月から
        cycleSetting: {
          enabled: true,
          interval: 2,
          unit: "month",
        },
      };

      const source = convertExpenseToExpenseSource(expense);

      // 1年目2月から隔月
      expect(source.calculate(1, 1)).toEqual({ income: 0, expense: 0 }); // 開始前
      expect(source.calculate(1, 2)).toEqual({ income: 0, expense: 8000 }); // 0ヶ月目
      expect(source.calculate(1, 3)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(1, 4)).toEqual({ income: 0, expense: 8000 }); // 2ヶ月目
      expect(source.calculate(1, 5)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(1, 6)).toEqual({ income: 0, expense: 8000 }); // 4ヶ月目
    });
  });

  describe("年単位のサイクル設定", () => {
    it("毎年支出が発生する", () => {
      const expense: Expense = {
        id: "1",
        name: "年会費",
        monthlyAmount: 120000,
        color: "#EF4444",
        startYearMonth: YearMonthDuration.from(1, 4), // 1年目4月から
        cycleSetting: {
          enabled: true,
          interval: 1,
          unit: "year",
        },
      };

      const source = convertExpenseToExpenseSource(expense);

      // 1年目4月から毎年同月
      expect(source.calculate(1, 3)).toEqual({ income: 0, expense: 0 }); // 開始前
      expect(source.calculate(1, 4)).toEqual({ income: 0, expense: 120000 }); // 0ヶ月目
      expect(source.calculate(1, 5)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(2, 3)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(2, 4)).toEqual({ income: 0, expense: 120000 }); // 12ヶ月目
      expect(source.calculate(2, 5)).toEqual({ income: 0, expense: 0 });
      expect(source.calculate(3, 4)).toEqual({ income: 0, expense: 120000 }); // 24ヶ月目
    });

    it("2年ごとに支出が発生する", () => {
      const expense: Expense = {
        id: "1",
        name: "車検",
        monthlyAmount: 100000,
        color: "#EF4444",
        startYearMonth: YearMonthDuration.from(1, 9), // 1年目9月から
        cycleSetting: {
          enabled: true,
          interval: 2,
          unit: "year",
        },
      };

      const source = convertExpenseToExpenseSource(expense);

      // 1年目9月から2年ごと
      expect(source.calculate(1, 9)).toEqual({ income: 0, expense: 100000 }); // 0ヶ月目
      expect(source.calculate(2, 9)).toEqual({ income: 0, expense: 0 }); // 12ヶ月目
      expect(source.calculate(3, 9)).toEqual({ income: 0, expense: 100000 }); // 24ヶ月目
      expect(source.calculate(4, 9)).toEqual({ income: 0, expense: 0 }); // 36ヶ月目
      expect(source.calculate(5, 9)).toEqual({ income: 0, expense: 100000 }); // 48ヶ月目
    });
  });

  describe("期間とサイクル設定の組み合わせ", () => {
    it("期間内でサイクル設定に従って支出が発生する", () => {
      const expense: Expense = {
        id: "1",
        name: "期間限定支出",
        monthlyAmount: 50000,
        color: "#EF4444",
        startYearMonth: YearMonthDuration.from(1, 1), // 1年目1月から
        endYearMonth: YearMonthDuration.from(1, 12), // 1年目12月まで
        cycleSetting: {
          enabled: true,
          interval: 4,
          unit: "month",
        },
      };

      const source = convertExpenseToExpenseSource(expense);

      // 1年目1月から12月まで、4ヶ月ごと
      expect(source.calculate(1, 1)).toEqual({ income: 0, expense: 50000 }); // 0ヶ月目
      expect(source.calculate(1, 5)).toEqual({ income: 0, expense: 50000 }); // 4ヶ月目
      expect(source.calculate(1, 9)).toEqual({ income: 0, expense: 50000 }); // 8ヶ月目
      expect(source.calculate(2, 1)).toEqual({ income: 0, expense: 0 }); // 期間外
    });
  });

  describe("サイクル設定が無効の場合", () => {
    it("毎月支出が発生する", () => {
      const expense: Expense = {
        id: "1",
        name: "通常支出",
        monthlyAmount: 20000,
        color: "#EF4444",
        startYearMonth: YearMonthDuration.from(1, 1), // 1年目1月から
        cycleSetting: {
          enabled: false,
          interval: 3,
          unit: "month",
        },
      };

      const source = convertExpenseToExpenseSource(expense);

      // サイクル設定が無効なので毎月発生
      expect(source.calculate(1, 1)).toEqual({ income: 0, expense: 20000 });
      expect(source.calculate(1, 2)).toEqual({ income: 0, expense: 20000 });
      expect(source.calculate(1, 3)).toEqual({ income: 0, expense: 20000 });
      expect(source.calculate(1, 4)).toEqual({ income: 0, expense: 20000 });
    });
  });

  describe("開始年月が設定されていない場合", () => {
    it("サイクル設定が有効でも毎月支出が発生する", () => {
      const expense: Expense = {
        id: "1",
        name: "開始日なし支出",
        monthlyAmount: 15000,
        color: "#EF4444",
        cycleSetting: {
          enabled: true,
          interval: 2,
          unit: "month",
        },
      };

      const source = convertExpenseToExpenseSource(expense);

      // 開始年月がないのでサイクル設定は無視される
      expect(source.calculate(1, 1)).toEqual({ income: 0, expense: 15000 });
      expect(source.calculate(1, 2)).toEqual({ income: 0, expense: 15000 });
      expect(source.calculate(1, 3)).toEqual({ income: 0, expense: 15000 });
    });
  });
});
