"use client"; transact

import { useState, useEffect, useCallback, useMemo } from "react";
import * as api from "@/lib/api";
import { User, AdminTransaction } from "@/lib/types";

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [formSuccess, setFormSuccess] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [filterText, setFilterText] = useState("");
  const [filterType, setFilterType] = useState<"all" | "transfer" | "adjustment">("all");

  // Clear form success message after 3 seconds
  useEffect(() => {
    if (formSuccess) {
      const timer = setTimeout(() => setFormSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [formSuccess]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, transactionsRes] = await Promise.all([
        api.getAllUsers(),
        api.getAdminTransactions(),
      ]);
      setUsers(usersRes);
      setTransactions(transactionsRes);
    } catch (err) {
      setError("Failed to fetch admin data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setIsSubmitting(true);

    const parsedAmount = parseInt(amount, 10);
    if (!selectedUserId || isNaN(parsedAmount)) {
      setFormError("Please select a user and enter a valid amount.");
      setIsSubmitting(false);
      return;
    }

    try {
      await api.adjustPoints(Number(selectedUserId), parsedAmount, reason);
      setFormSuccess(`Successfully adjusted points for the user.`);
      setSelectedUserId("");
      setAmount("");
      setReason("");
      fetchData(); // Refresh data
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to adjust points.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => {
        if (filterType === "all") return true;
        return tx.type === filterType;
      })
      .filter(tx => {
        if (!filterText) return true;
        const searchText = filterText.toLowerCase();
        const parties = [tx.sender, tx.receiver, tx.admin, tx.user, tx.reason].filter(Boolean).join(' ').toLowerCase();
        return parties.includes(searchText);
      });
  }, [transactions, filterText, filterType]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  if (loading) return <p>Loading admin dashboard...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Point Adjustment Form */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8">
        <h3 className="text-xl font-bold mb-4">Adjust User Points</h3>
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          {formError && <p className="text-red-500 text-sm">{formError}</p>}
          {formSuccess && <p className="text-green-500 text-sm">{formSuccess}</p>}
          <div>
            <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">User</label>
                        <select
              id="user-select"
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                if (formError) setFormError("");
              }}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600">
              <option value="">-- Select a user --</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.nickname}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (use negative for deduction)</label>
            <input type="number" id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason (optional)</label>
           <input type="text" id="reason" value={reason} onChange={(e) => {
                setReason(e.target.value);
                if (formError) setFormError("");
              }}
              className="mt-1 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400">
            {isSubmitting ? 'Submitting...' : 'Adjust Points'}
          </button>
        </form>
      </div>

      {/* All Transactions Table */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8">
        <h3 className="text-xl font-bold mb-4">All Transactions</h3>
                {/* Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by user, reason..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="shadow appearance-none border rounded w-full md:w-1/2 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="shadow appearance-none border rounded w-full md:w-1/4 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="transfer">Transfers</option>
            <option value="adjustment">Adjustments</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
               {filteredTransactions.map(tx => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{tx.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {tx.type === 'transfer' ? `From: ${tx.sender} To: ${tx.receiver}` : `Admin: ${tx.admin} User: ${tx.user}`}
                    {tx.reason && <span className="block text-xs text-gray-500">Reason: {tx.reason}</span>}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(tx.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && <p className="text-center py-4 text-gray-500">No transactions match your filters.</p>}
      </div>
    </div>
  );
}