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
} from '@mui/material';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';

// API base URL - using the correct backend URL
const API_BASE_URL = 'http://localhost:4575/api';

interface Expense {
  id: number;
  description: string;
  amount: number;
  status: 'on_progress' | 'approved' | 'denied';
  reviewer_comment?: string;
  operations: boolean;
  job_id?: string;
  job?: {
    id: string;
    name: string;
  };
  expenseType: {
    id: number;
    name: string;
  };
}

export default function ExpenseApprovalPage() {
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
      
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched expenses:', data); // Debug log
      setExpenses(data);
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

    try {
      setError(null);
      
      // Get the user ID from the JWT token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Decode the JWT token to get the user ID
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userId = tokenPayload.id;

      if (!userId) {
        throw new Error('User ID not found in token. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/expenses/${selectedExpense.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: reviewStatus,
          reviewer_comment: reviewComment,
          reviewed_by: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (errorData?.error?.includes('foreign key constraint')) {
          throw new Error('Authentication error. Please log in again.');
        }
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

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

  // Filter job-related expenses
  const jobRelatedExpenses = expenses.filter(expense => 
    !expense.operations && expense.job_id && expense.status === 'on_progress'
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
                  <TableCell>Job</TableCell>
                  <TableCell>Type</TableCell>
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
                ) : jobRelatedExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">
                        No expenses pending review
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  jobRelatedExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.job?.name || 'N/A'}</TableCell>
                      <TableCell>{expense.expenseType?.name}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>${expense.amount.toFixed(2)}</TableCell>
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
                )}
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