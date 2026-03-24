"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getAllFromDB, clearReciteRecords, STORES } from "@/lib/db";
import { DBUser, ReciteDetail, ReciteSummary } from "@/components/recite-records-dialog";

export interface ReciteRecordsState {
  loading: boolean;
  users: DBUser[];
  todayDetails: ReciteDetail[];
  historyDetails: ReciteDetail[];
  summaries: ReciteSummary[];
  stats: {
    totalCount: number;
    passCount: number;
    unpassCount: number;
    passRate: number;
    summaryCount: number;
    totalSummaryPoems: number;
  };
}

export interface ReciteFilters {
  selectedUser: string;
  searchKeyword: string;
  selectedDynasty: string;
  dateFrom: string;
  dateTo: string;
  detailSort: string;
  summarySort: string;
}

export function useReciteRecords(open: boolean, filters: ReciteFilters) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [todayDetails, setTodayDetails] = useState<ReciteDetail[]>([]);
  const [historyDetails, setHistoryDetails] = useState<ReciteDetail[]>([]);
  const [summaries, setSummaries] = useState<ReciteSummary[]>([]);
  const [todayPage, setTodayPage] = useState(9);
  const [historyPage, setHistoryPage] = useState(9);
  const [summaryPage, setSummaryPage] = useState(9);

  const loadUsers = useCallback(async () => {
    const userList = await getAllFromDB<DBUser>(STORES.USERS);
    setUsers(userList);
  }, []);

  const loadData = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const details = await getAllFromDB<ReciteDetail>(STORES.RECITE_DETAIL);
      let data = [...details];

      if (filters.selectedUser !== 'all') {
        data = data.filter((d) => String(d.user_id) === filters.selectedUser);
      }
      if (filters.searchKeyword.trim()) {
        const kw = filters.searchKeyword.toLowerCase();
        data = data.filter((d) => `${d.title} ${d.author} ${d.dynasty}`.toLowerCase().includes(kw));
      }
      if (filters.selectedDynasty !== 'all') {
        data = data.filter((d) => d.dynasty === filters.selectedDynasty);
      }
      if (filters.dateFrom) data = data.filter((d) => d.createdAt >= filters.dateFrom);
      if (filters.dateTo) data = data.filter((d) => d.createdAt <= filters.dateTo + 'T23:59:59.999Z');

      const now = new Date();
      const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const today = data.filter((d) => d.createdAt.startsWith(todayKey));
      const hist = data.filter((d) => !d.createdAt.startsWith(todayKey));

      if (filters.detailSort === 'newest') {
        today.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        hist.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } else if (filters.detailSort === 'oldest') {
        today.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        hist.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      }
      setTodayDetails(today);
      setHistoryDetails(hist);

      const sums = await getAllFromDB<ReciteSummary>(STORES.RECITE_SUMMARY);
      let filteredSums = [...sums];
      if (filters.selectedUser !== 'all') {
        filteredSums = filteredSums.filter((s) => String(s.user_id) === filters.selectedUser);
      }
      if (filters.searchKeyword.trim()) {
        const kw = filters.searchKeyword.toLowerCase();
        filteredSums = filteredSums.filter((s) =>
          s.poem_ids.some((p) => p.title.toLowerCase().includes(kw))
        );
      }
      if (filters.dateFrom) filteredSums = filteredSums.filter((s) => s.createdAt >= filters.dateFrom);
      if (filters.dateTo) filteredSums = filteredSums.filter((s) => s.createdAt <= filters.dateTo + 'T23:59:59.999Z');
      if (filters.summarySort === 'newest') {
        filteredSums.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } else if (filters.summarySort === 'oldest') {
        filteredSums.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      } else if (filters.summarySort === 'pass-rate') {
        filteredSums.sort((a, b) => {
          const aTotal = a.pass_count + a.unpass_count;
          const bTotal = b.pass_count + b.unpass_count;
          const aRate = aTotal > 0 ? a.pass_count / aTotal : 0;
          const bRate = bTotal > 0 ? b.pass_count / bTotal : 0;
          return bRate - aRate;
        });
      }
      setSummaries(filteredSums);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [open, filters]);

  const resetPagination = useCallback(() => {
    setTodayPage(5);
    setHistoryPage(5);
    setSummaryPage(5);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (open) resetPagination(); }, [open, resetPagination]);

  const clearOldData = useCallback(async () => {
    await clearReciteRecords();
  }, []);

  useEffect(() => {
    const CLEARED_KEY = "recite_records_cleared_v1";
    if (open && !sessionStorage.getItem(CLEARED_KEY)) {
      clearOldData().then(() => sessionStorage.setItem(CLEARED_KEY, "true"));
    }
  }, [open, clearOldData]);

  const stats = useMemo(() => {
    const allDetails = [...todayDetails, ...historyDetails];
    const totalCount = allDetails.length;
    const passCount = allDetails.filter(d => d.status).length;
    const unpassCount = totalCount - passCount;
    const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;
    const summaryCount = summaries.length;
    const totalSummaryPoems = summaries.reduce((acc, s) => acc + s.poem_ids.length, 0);
    return { totalCount, passCount, unpassCount, passRate, summaryCount, totalSummaryPoems };
  }, [todayDetails, historyDetails, summaries]);

  return {
    loading,
    users,
    todayDetails,
    historyDetails,
    summaries,
    stats,
    todayPage,
    historyPage,
    summaryPage,
    setTodayPage,
    setHistoryPage,
    setSummaryPage,
  };
}
