"use client";

import { Transaction } from "@/lib/types";

interface TransactionHistoryProps {
  history: Transaction[];
}

export default function TransactionHistory({ history }: TransactionHistoryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTransactionRow = (tx: Transaction, index: number) => {
    let amountDisplay;
    let description = "";

    switch (tx.type) {
      case "sent":
        amountDisplay = <span className="text-red-500">- {tx.amount.toLocaleString()}</span>;
        description = `To: ${tx.party}`;
        break;
      case "received":
        amountDisplay = <span className="text-green-500">+ {tx.amount.toLocaleString()}</span>;
        description = `From: ${tx.party}`;
        break;
      case "adjustment":
        amountDisplay = (
          <span className={tx.amount >= 0 ? "text-blue-500" : "text-yellow-500"}>
            {tx.amount >= 0 ? "+" : ""}
            {tx.amount.toLocaleString()}
          </span>
        );
        description = `Admin adjustment by ${tx.party}`;
        break;
    }

    return (
      <li key={index} className="flex justify-between items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
        <div>
          <p className="font-semibold">{description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(tx.created_at)}</p>
        </div>
        <p className="font-bold">{amountDisplay}</p>
      </li>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8">
      <h3 className="text-xl font-bold mb-4">Transaction History</h3>
      {history.length > 0 ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-600 max-h-96 overflow-y-auto">
          {history.map(getTransactionRow)}
        </ul>
      ) : (
        <p className="text-gray-500">No transactions yet.</p>
      )}
    </div>
  );
}