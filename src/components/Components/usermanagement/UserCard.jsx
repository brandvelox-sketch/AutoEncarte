import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function UserCard({ user, currentUser }) {
  const isCurrentUser = user.id === currentUser?.id;
  const isAdmin = user.role === 'admin';

  return (
    <Card className={`hover:shadow-md transition-shadow ${isCurrentUser ? 'border-blue-500 border-2' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12">
            <AvatarFallback className={`text-white font-semibold ${
              isAdmin ? 'bg-gradient-to-br from-purple-600 to-purple-700' : 'bg-gradient-to-br from-blue-600 to-blue-700'
            }`}>
              {user.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {user.full_name || 'Usuário'}
              </h3>
              {isCurrentUser && (
                <Badge variant="outline" className="text-xs">
                  Você
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                {isAdmin ? (
                  <><Shield className="w-3 h-3 mr-1" /> Administrador</>
                ) : (
                  <><User className="w-3 h-3 mr-1" /> Operador</>
                )}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t text-xs text-gray-500">
          Membro desde {format(new Date(user.created_date), "MMMM 'de' yyyy", { locale: ptBR })}
        </div>
      </CardContent>
    </Card>
  );
}