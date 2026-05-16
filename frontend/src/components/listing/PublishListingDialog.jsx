import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

/**
 * PublishListingDialog component for selecting availability date ranges
 * Supports multiple date ranges as required by Feature 2.2.5
 * @param {Object} props - Component props
 * @param {boolean} props.open - Dialog open state
 * @param {Function} props.onClose - Close dialog callback
 * @param {Function} props.onPublish - Publish callback with availability ranges
 * @param {string} props.listingTitle - Listing title for display
 */
const PublishListingDialog = ({ open, onClose, onPublish, listingTitle }) => {
  const [dateRanges, setDateRanges] = useState([
    { start: '', end: '' },
  ]);
  const [error, setError] = useState('');

  // Handle date range change
  const handleDateRangeChange = (index, field, value) => {
    const newDateRanges = [...dateRanges];
    newDateRanges[index][field] = value;
    setDateRanges(newDateRanges);
    setError(''); // Clear error when user makes changes
  };
  // Add new date range
  const addDateRange = () => {
    setDateRanges([...dateRanges, { start: '', end: '' }]);
  };

  // Remove date range
  const removeDateRange = (index) => {
    if (dateRanges.length > 1) {
      const newDateRanges = dateRanges.filter((_, i) => i !== index);
      setDateRanges(newDateRanges);
    }
  };

  // Validate date ranges
  const validateDateRanges = () => {
    // Check if at least one date range exists
    if (dateRanges.length === 0) {
      setError('At least one availability date range is required');
      return false;
    }

    // Check all date ranges have both start and end dates
    for (let i = 0; i < dateRanges.length; i++) {
      const range = dateRanges[i];
      if (!range.start || !range.end) {
        setError(`Date range ${i + 1}: Both start and end dates are required`);
        return false;
      }

      // Check start date is before end date
      const startDate = new Date(range.start);
      const endDate = new Date(range.end);
      if (startDate >= endDate) {
        setError(`Date range ${i + 1}: Start date must be before end date`);
        return false;
      }

      // Check dates are not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        setError(`Date range ${i + 1}: Start date cannot be in the past`);
        return false;
      }
    }

    return true;
  };
  // Handle publish
  const handlePublish = () => {
    if (!validateDateRanges()) {
      return;
    }
    // Format date ranges for backend
    const availability = dateRanges.map((range) => ({
      start: range.start,
      end: range.end,
    }));

    onPublish(availability);
    handleClose();
  };
  // Handle close dialog
  const handleClose = () => {
    setDateRanges([{ start: '', end: '' }]);
    setError('');
    onClose();
  };
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Publish Listing</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set availability date ranges for &quot;{listingTitle}&quot;
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Availability Dates
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={addDateRange}
              aria-label="Add date range"
            >
              Add Range
            </Button>
          </Box>
          {dateRanges.map((range, index) => (
            <Box
              key={index}
              sx={{
                p: 2,
                mb: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2">Date Range {index + 1}</Typography>
                {dateRanges.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => removeDateRange(index)}
                    color="error"
                    aria-label={`Remove date range ${index + 1}`}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={range.start}
                  onChange={(e) => handleDateRangeChange(index, 'start', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={range.end}
                  onChange={(e) => handleDateRangeChange(index, 'end', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  required
                />
              </Box>
            </Box>
          ))}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Note: You can add multiple date ranges. Each range must have valid start and end dates.
          The listing will be visible to guests only during these date ranges.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handlePublish} variant="contained" color="primary">
          Publish Listing
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default PublishListingDialog;