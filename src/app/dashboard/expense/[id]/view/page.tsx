'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getExpenseById, deleteExpense } from '@/api/expenseApi';
import type { Expense } from '@/types/expense';
import {
  Box,
  Button,
  Typography,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  CardContent,
  Divider,
  Stack,
  Container,
  Skeleton,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  Comment as CommentIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Payment as PaymentIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import ExpenseForm from '@/components/dashboard/expense/ExpenseForm';

interface ExpenseViewPageProps {
  params: {
    id: string;
  };
}

const ExpenseViewPage: React.FC<ExpenseViewPageProps> = ({ params }) => {
  const formatCurrency = (amount: number | string | undefined): string => {
    if (amount === undefined || amount === null) return '$0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${num.toFixed(2)}`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string, paid: boolean) => {
    if (paid) return <PaymentIcon color="success" />;
    switch (status) {
      case 'approved':
        return <CheckCircleIcon color="success" />;
      case 'denied':
        return <CancelIcon color="error" />;
      case 'on_progress':
        return <PendingIcon color="warning" />;
      default:
        return <PendingIcon color="warning" />;
    }
  };

  const getStatusColor = (status: string, paid: boolean): 'success' | 'error' | 'warning' | 'default' => {
    if (paid) return 'success';
    switch (status) {
      case 'approved':
        return 'success';
      case 'denied':
        return 'error';
      case 'on_progress':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatStatus = (status: string, paid: boolean): string => {
    if (paid) return 'Paid';
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'denied':
        return 'Denied';
      case 'on_progress':
        return 'In Progress';
      default:
        return status || 'Unknown';
    }
  };

  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const loadExpense = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await getExpenseById(params.id);
      setExpense(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    try {
      await deleteExpense(params.id);
      setDeleteDialogOpen(false);
      router.push('/dashboard/expense');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  useEffect(() => {
    void loadExpense();
  }, [params.id]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Skeleton variant="rectangular" height={60} />
          <Skeleton variant="rectangular" height={400} />
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!expense) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">Expense not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={4}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton
              onClick={() => {
                router.push('/dashboard/expense');
              }}
              sx={{ color: 'primary.main' }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Expense Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ID: {expense.id}
              </Typography>
            </Box>
          </Stack>
          
          {!expense.paid && (
            <Stack direction="row" spacing={1}>
              <Tooltip title="Edit Expense">
                <IconButton color="primary" onClick={() => {
                  setFormOpen(true);
                }}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete Expense">
                <IconButton color="error" onClick={() => {
                  setDeleteDialogOpen(true);
                }}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
        </Box>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Basic Information Card */}
          <Grid item xs={12} lg={8}>
            <Card elevation={2}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
                  <ReceiptIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {expense.description}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {expense.expenseType?.name}
                    </Typography>
                  </Box>
                </Stack>

                <Grid container spacing={4}>
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <AccountBalanceIcon color="action" sx={{ fontSize: 28 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Total Amount
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                          {formatCurrency(expense.amount)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      {expense.operations ? <BusinessIcon color="action" sx={{ fontSize: 28 }} /> : <WorkIcon color="action" sx={{ fontSize: 28 }} />}
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Category
                        </Typography>
                        <Chip
                          label={expense.operations ? 'Operation' : 'Job'}
                          color={expense.operations ? 'primary' : 'secondary'}
                          size="medium"
                        />
                      </Box>
                    </Stack>
                  </Grid>

                  {expense.operations && expense.operationType && (
                    <Grid item xs={12} sm={6}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <BusinessIcon color="action" sx={{ fontSize: 28 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Operation Type
                          </Typography>
                          <Typography variant="h6" fontWeight="medium">
                            {expense.operationType.name}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  )}

                  {!expense.operations && expense.job && (
                    <Grid item xs={12} sm={6}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <WorkIcon color="action" sx={{ fontSize: 28 }} />
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Job
                          </Typography>
                          <Typography variant="h6" fontWeight="medium">
                            {expense.job.name}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Status Information Card */}
          <Grid item xs={12} lg={4}>
            <Card elevation={2}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  Status Information
                </Typography>
                
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Current Status
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      {getStatusIcon(expense.status || '', expense.paid)}
                      <Chip
                        label={formatStatus(expense.status || '', expense.paid)}
                        color={getStatusColor(expense.status || '', expense.paid)}
                        size="medium"
                      />
                    </Stack>
                  </Box>

                  <Divider />

                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Payment Status
                    </Typography>
                    <Chip
                      label={expense.paid ? 'Paid' : 'Unpaid'}
                      color={expense.paid ? 'success' : 'default'}
                      size="medium"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Timeline & Details Card */}
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 4 }}>
                  Timeline & Details
                </Typography>
                
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
                      Timeline
                    </Typography>
                    <Stack spacing={3}>
                      <Box>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <ScheduleIcon color="action" />
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Created At
                            </Typography>
                            <Typography variant="body1" fontWeight="medium">
                              {formatDate(expense.createdAt || expense.created_at)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      {expense.updated_at && expense.updated_at !== expense.created_at && (
                        <Box>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <ScheduleIcon color="action" />
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Last Updated
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {formatDate(expense.updated_at)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      )}

                      {expense.reviewed_at && (
                        <Box>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <ScheduleIcon color="action" />
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Reviewed At
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {formatDate(expense.reviewed_at)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
                      Users & Actions
                    </Typography>
                    <Stack spacing={3}>
                      {expense.editor && (
                        <Box>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <PersonIcon color="action" />
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Updated By
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {`${expense.editor.firstName} ${expense.editor.lastName || ''}`}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      )}

                      {expense.reviewer && (
                        <Box>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <PersonIcon color="action" />
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Approved By
                              </Typography>
                              <Typography variant="body1" fontWeight="medium">
                                {`${expense.reviewer.firstName} ${expense.reviewer.lastName || ''}`}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </Grid>

                  {expense.reason_to_edit && (
                    <Grid item xs={12}>
                      <Box>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <CommentIcon color="action" sx={{ mt: 0.5 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Reason for Update
                            </Typography>
                            <Typography variant="body1" sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                              {expense.reason_to_edit}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Grid>
                  )}

                  {expense.reviewer_comment && (
                    <Grid item xs={12}>
                      <Box>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <CommentIcon color="action" sx={{ mt: 0.5 }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Review Comment
                            </Typography>
                            <Typography variant="body1" sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
                              {expense.reviewer_comment}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => {
        setDeleteDialogOpen(false);
      }}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this expense? This action cannot be undone.
          </Typography>
          {expense && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Expense Details:
              </Typography>
              <Typography variant="body2">
                {expense.description} - {formatCurrency(expense.amount)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
          }}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Form Dialog */}
      <ExpenseForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
        }}
        onSuccess={loadExpense}
        expense={expense}
        mode="edit"
      />
    </Container>
  );
};

export default ExpenseViewPage; 