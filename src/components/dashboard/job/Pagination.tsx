import React from 'react';
import {
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  Typography,
  IconButton,
} from '@mui/material';
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  limit,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  onLimitChange,
}) => {
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalCount);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 3,
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      {/* Items per page selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Items per page:
        </Typography>
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            displayEmpty
          >
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Page info */}
      <Typography variant="body2" color="text.secondary">
        {startItem}-{endItem} of {totalCount}
      </Typography>

      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={() => onPageChange(1)}
          disabled={!hasPrevPage}
          size="small"
        >
          <FirstPageIcon />
        </IconButton>
        <IconButton
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
          size="small"
        >
          <NavigateBeforeIcon />
        </IconButton>

        {/* Page numbers */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? 'contained' : 'outlined'}
                size="small"
                onClick={() => onPageChange(pageNum)}
                sx={{ minWidth: 32, height: 32 }}
              >
                {pageNum}
              </Button>
            );
          })}
        </Box>

        <IconButton
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          size="small"
        >
          <NavigateNextIcon />
        </IconButton>
        <IconButton
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage}
          size="small"
        >
          <LastPageIcon />
        </IconButton>
      </Box>
    </Box>
  );
}; 