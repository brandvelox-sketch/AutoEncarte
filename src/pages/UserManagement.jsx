import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus } from 'lucide-react';
import UserCard from '@/components/Components/usermanagement/UserCard';

export default function UserManagement() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userService.getCurrentUser(),
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Separar admins e operadores
  const admins = users.filter(u => u.role === 'admin');
  const operators = users.filter(u => u.role === 'operator');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Gerenciar Usuários
          </h1>
          <p className="text-gray-600 mt-1">
            {users.length} {users.length === 1 ? 'usuário registrado' : 'usuários registrados'} no sistema
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          disabled
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Adicionar Usuário
        </Button>
      </div>

      {users.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum usuário encontrado</h3>
            <p className="text-gray-500">Os usuários aparecerão aqui assim que forem criados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Administradores */}
          {admins.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Administradores
                </CardTitle>
                <CardDescription>
                  {admins.length} {admins.length === 1 ? 'administrador' : 'administradores'} com acesso completo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {admins.map(user => (
                    <UserCard key={user.id} user={user} currentUser={currentUser} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operadores */}
          {operators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  Operadores
                </CardTitle>
                <CardDescription>
                  {operators.length} {operators.length === 1 ? 'operador' : 'operadores'} no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {operators.map(user => (
                    <UserCard key={user.id} user={user} currentUser={currentUser} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}