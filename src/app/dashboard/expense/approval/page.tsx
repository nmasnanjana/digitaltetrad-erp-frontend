'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Container,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
} from '@mui/material';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllExpenses, reviewExpense } from '@/api/expense-api';
import { CACHE_KEYS, invalidateCache } from '@/lib/react-query/cache-manager';
import { type Expense } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';
import { useUser } from '@/contexts/user-context';

export default function ExpenseApprovalPage() {
  const { formatCurrency } = useSettings();
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  // Get pending expenses with React Query
  const { data: expenses = [], isLoading, error: queryError } = useQuery({
    queryKey: [CACHE_KEYS.EXPENSES, 'pending'],
    queryFn: async () => {
      const response = await getAllExpenses();
      return response.data.filter(expense => expense.status === 'on_progress');
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for approval data
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Review expense mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ expenseId, status }: { expenseId: string; status: 'approved' | 'denied' }) => {
      return reviewExpense(expenseId, {
        status,
        reviewed_by: user?.id?.toString() || '0',
        reviewer_comment: reviewComment
      });
    },
    onSuccess: () => {
      // Invalidate expenses cache to refresh the list
      invalidateCache.expenses();
      // Also invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.EXPENSE_DASHBOARD] });
    },
  });

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'denied'>('approved');
  const [reviewComment, setReviewComment] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  // const [loading, setLoading] = useState(true); // This state is now managed by React Query

  // useEffect(() => {
  //   fetchExpenses();
  // }, []);

  // const fetchExpenses = async () => {
  //   try {
  //     setLoading(true);
  //     setError(null);
  //     const response = await getAllExpenses();
  //     setExpenses(response.data);
  //   } catch (error) {
  //     console.error('Error fetching expenses:', error);
  //     setError(error instanceof Error ? error.message : 'Failed to load expenses. Please try again later.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleReview = (expense: Expense) => {
    setSelectedExpense(expense);
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedExpense) return;
    
    if (!user?.id) {
      setLocalError('User not loaded. Please refresh the page and try again.');
      return;
    }
    
    // Validate comment is required for denied expenses
    if (reviewStatus === 'denied' && !reviewComment.trim()) {
      setLocalError('Comment is required when denying an expense.');
      return;
    }
    
    console.log('Current user:', user);
    console.log('User ID:', user.id);
    console.log('User ID type:', typeof user.id);

    try {
      setLocalError(null);
      
      console.log('Reviewing expense with user ID:', user.id);
      
      reviewMutation.mutate({ expenseId: selectedExpense.id.toString(), status: reviewStatus });

      // await fetchExpenses(); // This is now handled by onSuccess of reviewMutation
      setReviewDialogOpen(false);
      setReviewComment('');
      setSelectedExpense(null);
    } catch (error) {
      console.error('Error reviewing expense:', error);
      setLocalError(error instanceof Error ? error.message : 'Failed to submit review. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success.main';
      case 'denied':
        return 'error.main';
      default:
        return 'warning.main';
    }
  };

  // Filter expenses that need approval (both job and operation expenses with on_progress status)
  const pendingExpenses = expenses;

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: { xs: 2, sm: 4, md: 6, lg: 8 },
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Stack
            direction="column"
            justifyContent="space-between"
            spacing={{ xs: 2, sm: 4 }}
            sx={{
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' }
            }}
          >
            <Stack spacing={1}>
              <Typography variant="h4">
                Expense Approval
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Review and approve job-related expenses
              </Typography>
            </Stack>
          </Stack>

          {localError ? <Alert severity="error" onClose={() => { setLocalError(null); }}>
              {localError}
            </Alert> : null}

          <Card>
            <TableContainer sx={{ 
              overflowX: 'auto',
              '& .MuiTable-root': {
                minWidth: { xs: 600, sm: 800, md: 1000 }
              }
            }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }}>Category</TableCell>
                    <TableCell sx={{ minWidth: { xs: 80, sm: 100 } }}>Type</TableCell>
                    <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }}>Expense Type</TableCell>
                    <TableCell sx={{ minWidth: { xs: 120, sm: 150 }, display: { xs: 'none', md: 'table-cell' } }}>Description</TableCell>
                    <TableCell sx={{ minWidth: { xs: 80, sm: 100 } }}>Amount</TableCell>
                    <TableCell sx={{ minWidth: { xs: 80, sm: 100 } }}>Status</TableCell>
                    <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">
                        Loading expenses...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : pendingExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">
                        No expenses pending review
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) :
                  pendingExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {expense.operations ? expense.operationType?.name || 'N/A' : expense.job?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{expense.expenseType?.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={expense.operations ? 'Operation' : 'Job'}
                          color={expense.operations ? 'primary' : 'secondary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {expense.description}
                      </TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: getStatusColor(expense.status || 'on_progress'),
                            fontWeight: 'bold',
                          }}
                        >
                          {expense.status || 'on_progress'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => { handleReview(expense); }}
                            size="small"
                            sx={{ 
                              minWidth: { xs: 'auto', sm: 'auto' },
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
                            Review
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
            </TableContainer>
          </Card>
        </Stack>
      </Container>

      <Dialog open={reviewDialogOpen} onClose={() => { setReviewDialogOpen(false); }}>
        <DialogTitle>Review Expense</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={reviewStatus}
                label="Status"
                onChange={(e) => { setReviewStatus(e.target.value as 'approved' | 'denied'); }}
              >
                <MenuItem value="approved">Approve</MenuItem>
                <MenuItem value="denied">Deny</MenuItem>
              </Select>
            </FormControl>
            
            {/* Only show comment field for denied expenses */}
            {reviewStatus === 'denied' && (
              <TextField
                fullWidth
                label="Comment (Required)"
                multiline
                rows={4}
                value={reviewComment}
                onChange={(e) => { setReviewComment(e.target.value); }}
                required
                error={reviewStatus === 'denied' && !reviewComment.trim()}
                helperText={reviewStatus === 'denied' && !reviewComment.trim() ? 'Comment is required when denying an expense' : ''}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setReviewDialogOpen(false); }}>Cancel</Button>
          <Button onClick={handleReviewSubmit} variant="contained">
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 