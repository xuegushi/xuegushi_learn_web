"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { useUserStore, User } from "@/lib/api/user-store";

export function UserMenu() {
  const { currentUser, users, initialize, switchUser, addUser } = useUserStore();
  const [showCreateUser, setShowCreateUser] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const otherUsers = users.filter((u) => u.id !== currentUser?.user_id);

  const handleCreateUser = async (userName: string) => {
    const newUser = await addUser(userName);
    if (newUser) {
      await switchUser(newUser);
    }
  };

  if (!currentUser) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
          <span className="text-sm font-medium">{currentUser.user_name}</span>
          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-30">
          {otherUsers.length > 0 && (
            <DropdownMenuGroup>
              <DropdownMenuLabel>其他用户</DropdownMenuLabel>
              {otherUsers.map((user) => (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => switchUser(user)}
                  className="cursor-pointer">
                  {user.user_name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
          {otherUsers.length > 0 &&
            <DropdownMenuSeparator />
          }
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => setShowCreateUser(true)}
              className="cursor-pointer">
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
