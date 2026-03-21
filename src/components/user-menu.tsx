"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { getAllFromDB, setToDB, STORES } from "@/lib/db";

interface User {
  id: number;
  user_name: string;
}

export function UserMenu() {
  const [currentUser, setCurrentUser] = useState<{ user_id: number; user_name: string } | null>(null);
  const [otherUsers, setOtherUsers] = useState<User[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const loadUserData = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUser(user);
          const users = await getAllFromDB<User>(STORES.USERS);
          setOtherUsers(users.filter((u) => u.id !== user.user_id));
        }
      } catch {
        // Silent fail
      }
    };
    loadUserData();
  }, []);

  const switchUser = async (user: User) => {
    const userData = { user_id: user.id, user_name: user.user_name };
    localStorage.setItem("user", JSON.stringify(userData));
    setCurrentUser(userData);
    const users = await getAllFromDB<User>(STORES.USERS);
    setOtherUsers(users.filter((u) => u.id !== user.id));
  };

  const handleCreateUser = async (userName: string) => {
    const userData = {
      user_name: userName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await setToDB(STORES.USERS, userData);

    const users = await getAllFromDB<User>(STORES.USERS);
    const newUser = users[users.length - 1];
    await switchUser(newUser);
  };

  if (!currentUser) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
          <span className="text-sm font-medium">{currentUser.user_name}</span>
          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {otherUsers.length > 0 && (
            <DropdownMenuGroup>
              <DropdownMenuLabel>其他用户</DropdownMenuLabel>
              {otherUsers.map((user) => (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => switchUser(user)}
                  className="cursor-pointer"
                >
                  {user.user_name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => setShowCreateUser(true)}
              className="cursor-pointer"
            >
              新增用户
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateUserDialog
        open={showCreateUser}
        onOpenChange={setShowCreateUser}
        onSubmit={handleCreateUser}
      />
    </>
  );
}
