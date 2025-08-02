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
import { getAllExpenses, reviewExpense } from '@/api/expenseApi';
import { Expense } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';
import { useUser } from '@/contexts/user-context';

export default function ExpenseApprovalPage() {
  const { formatCurrency } = useSettings();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'denied'>('approved');
  const [reviewComment, setReviewComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllExpenses();
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError(error instanceof Error ? error.message : 'Failed to load expenses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (expense: Expense) => {
    setSelectedExpense(expense);
    setReviewDialogOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedExpense) return;
    
    if (!user?.id) {
      setError('User not loaded. Please refresh the page and try again.');
      return;
    }
    
    console.log('Current user:', user);
    console.log('User ID:', user.id);
    console.log('User ID type:', typeof user.id);

    try {
      setError(null);
      
      console.log('Reviewing expense with user ID:', user.id);
      
      await reviewExpense(selectedExpense.id, {
        status: reviewStatus,
        reviewer_comment: reviewComment,
        reviewed_by: user.id
      });

      await fetchExpenses();
      setReviewDialogOpen(false);
      setReviewComment('');
      setSelectedExpense(null);
    } catch (error) {
      console.error('Error reviewing expense:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit review. Please try again.');
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
  const pendingExpenses = expenses.filter(expense => 
    expense.status === 'on_progress'
  );

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 8,
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Stack
            direction="row"
            justifyContent="space-between"
            spacing={4}
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

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Card>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Expense Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
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
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: getStatusColor(expense.status),
                            fontWeight: 'bold',
                          }}
                        >
                          {expense.status}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleReview(expense)}
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
          </Card>
        </Stack>
      </Container>

      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)}>
        <DialogTitle>Review Expense</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={reviewStatus}
                label="Status"
                onChange={(e) => setReviewStatus(e.target.value as 'approved' | 'denied')}
              >
                <MenuItem value="approved">Approve</MenuItem>
                <MenuItem value="denied">Deny</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Comment"
              multiline
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReviewSubmit} variant="contained">
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 