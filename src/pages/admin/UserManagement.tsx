import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserPlus, Trash2 } from 'lucide-react';
import { User, CreateReviewerForm } from '@/types';
import { getUsers, createReviewer, deleteUser } from '@/services/userService';
import PageHeader from '@/components/dashboard/PageHeader';
import DataTable, { Column } from '@/components/dashboard/DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<CreateReviewerForm>({
    username: '',
    email: '',
  });

  // Fetch users
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });

  // Create reviewer mutation
  const createMutation = useMutation({
    mutationFn: createReviewer,
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Reviewer Created',
        description: `Account for ${newUser.username} has been created. Credentials will be sent via email.`,
      });
      setIsCreateOpen(false);
      setFormData({ username: '', email: '' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'User Deleted',
        description: 'The user account has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateReviewer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const columns: Column<User>[] = [
    {
      key: 'username',
      header: 'Username',
      render: (user) => (
        <span className="font-medium text-foreground">{user.username}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (user) => (
        <span className="text-muted-foreground">{user.email}</span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <Badge 
          variant="outline"
          className={
            user.role === 'admin' 
              ? 'bg-primary/10 text-primary border-primary/20' 
              : 'bg-secondary text-secondary-foreground'
          }
        >
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(user.createdAt), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      render: (user) => (
        user.role !== 'admin' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              deleteMutation.mutate(user.id);
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management" 
        description="Manage reviewer accounts and access control."
      >
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Create Reviewer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Reviewer Account</DialogTitle>
              <DialogDescription>
                Add a new reviewer to the system. Credentials will be generated and sent via email.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateReviewer} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="e.g., jane.reviewer"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g., jane@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
                <p>
                  Credentials will be generated and stored in PostgreSQL and sent via email.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create Reviewer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Users Table */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">All Users</CardTitle>
          <CardDescription>
            {usersResponse?.total ?? 0} users in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={usersResponse?.data ?? []}
            columns={columns}
            keyExtractor={(user) => user.id}
            isLoading={isLoading}
            emptyMessage="No users found"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
