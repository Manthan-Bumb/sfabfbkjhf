import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export default function NotificationsBell() {
  const [data, setData] = useState({ items: [], unread: 0 });
  const load = () => api.get("/notifications").then(r => setData(r.data)).catch(() => {});
  useEffect(() => {
    load();
    const t = setInterval(load, 15000); // poll every 15s
    return () => clearInterval(t);
  }, []);

  const markAll = async () => { await api.post("/notifications/read-all"); load(); };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button data-testid="notif-bell" variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {data.unread > 0 && (
            <span data-testid="notif-unread-count" className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {data.unread > 9 ? "9+" : data.unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0 rounded-sm border-slate-200">
        <div className="flex items-center justify-between p-3 border-b border-slate-200">
          <div className="font-semibold text-sm">Notifications</div>
          {data.unread > 0 && <button data-testid="notif-mark-all" onClick={markAll} className="text-xs text-blue-600 hover:underline">Mark all read</button>}
        </div>
        <div className="max-h-96 overflow-auto">
          {data.items.length === 0 && <div className="p-8 text-center text-sm text-slate-500">No notifications</div>}
          {data.items.map(n => (
            <div key={n.id} className={`p-3 border-b border-slate-100 ${!n.read ? "bg-blue-50/40" : ""}`} data-testid={`notif-item-${n.id}`}>
              <div className="text-sm font-medium text-slate-900">{n.title}</div>
              <div className="text-xs text-slate-600 mt-0.5">{n.body}</div>
              <div className="text-[10px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
