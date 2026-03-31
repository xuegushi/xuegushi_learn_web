"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getAllFromDB, clearReciteRecords, STORES } from "@/lib/db";
import { DBUser, ReciteDetail } from "@/components/recite-records-dialog";
import { useUserStore } from "@/lib/api/user-store";

export interface ReciteRecordsState {
  loading: boolean;
  users: DBUser[];
  todayDetails: ReciteDetail[];
  historyDetails: ReciteDetail[];
  stats: {
    totalCount: number;
    passCount: number;
    unpassCount: number;
    passRate: number;
  };
}

export interface ReciteFilters {
  selectedUser: string;
  searchKeyword: string;
  selectedDynasty: string;
  dateFrom: string;
  dateTo: string;
  detailSort: string;
}

export function useReciteRecords(open: boolean, filters: ReciteFilters) {
  const { users: storeUsers, initialize } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [todayDetails, setTodayDetails] = useState<ReciteDetail[]>([]);
  const [historyDetails, setHistoryDetails] = useState<ReciteDetail[]>([]);
  const [todayPage, setTodayPage] = useState(9);
  const [historyPage, setHistoryPage] = useState(9);

  const users: DBUser[] = storeUsers.map(u => ({ id: u.id, user_name: u.user_name }));

  useEffect(() => {
    initialize();
  }, [initialize]);

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
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [open, filters]);

  const resetPagination = useCallback(() => {
    setTodayPage(9);
    setHistoryPage(9);
  }, []);

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
    return { totalCount, passCount, unpassCount, passRate };
  }, [todayDetails, historyDetails]);

  return {
    loading,
    users,
    todayDetails,
    historyDetails,
    stats,
    todayPage,
    historyPage,
    setTodayPage,
    setHistoryPage,
  };
}
