"use client";

import { useState, useEffect } from "react";
import * as api from "@/lib/api";

interface SendPointsFormProps {
  onTransactionSuccess: () => void;
}

export default function SendPointsForm({ onTransactionSuccess }: SendPointsFormProps) {
  const [receiverNickname, setReceiverNickname] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid positive amount.");
      setLoading(false);
      return;
    }

    try {
      await api.sendPoints(receiverNickname, parsedAmount);
      setSuccess(`Successfully sent ${parsedAmount} points to ${receiverNickname}!`);
      setReceiverNickname("");
      setAmount("");
      onTransactionSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send points.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8">
      <h3 className="text-xl font-bold mb-4">Send Points</h3>
      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
        {success && <p className="text-green-500 text-xs italic mb-4">{success}</p>}
        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="receiverNickname">
            Receiver's Nickname
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            id="receiverNickname"
            type="text"
            placeholder="Nickname"
            value={receiverNickname}
            onChange={(e) => {
              setReceiverNickname(e.target.value);
              if (error) setError("");
            }}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="amount">
            Amount
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            id="amount"
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (error) setError("");
            }}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:bg-gray-400"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}