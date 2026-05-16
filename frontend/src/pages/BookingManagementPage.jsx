import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { getListingById } from '../services/listingsService';
import { getMyBookings, acceptBooking, declineBooking } from '../services/bookingsService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const BookingManagementPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch listing details
      const listingData = await getListingById(id);
      setListing(listingData);
      
      // 2. Fetch all bookings
      const { getMyBookings } = await import('../services/bookingsService');
      const allBookings = await getMyBookings();
      
      console.log('All bookings:', allBookings);
      console.log('Current listing ID:', id);
      
      // 3. Filter bookings that belong to this listing
      const listingBookings = allBookings.filter(
        (booking) => String(booking.listingId) === String(id)
      );
      
      console.log('Filtered bookings for this listing:', listingBookings);
      
      setBookings(listingBookings);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to load data',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (bookingId) => {
    try {
      await acceptBooking(bookingId);
      setSnackbar({
        open: true,
        message: 'Booking accepted!',
        severity: 'success',
      });
      await fetchData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to accept booking',
        severity: 'error',
      });
    }
  };
  
  const handleDecline = async (bookingId) => {
    try {
      await declineBooking(bookingId);
      setSnackbar({
        open: true,
        message: 'Booking declined',
        severity: 'success',
      });
      await fetchData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to decline booking',
        severity: 'error',
      });
    }
  };

  // Get available years based on booking dates
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = new Set([currentYear]);
    
    bookings.forEach(booking => {
      const startDate = booking.dateRange?.start_day || booking.dateRange?.start;
      const endDate = booking.dateRange?.end_day || booking.dateRange?.end;
      
      if (startDate) {
        years.add(new Date(startDate).getFullYear());
      }
      if (endDate) {
        years.add(new Date(endDate).getFullYear());
      }
    });
    
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/my-listings')}
        sx={{ mb: 2 }}
      >
        Back to My Listings
      </Button>

      <Typography variant="h4" gutterBottom>
        Booking Requests - {listing?.title}
      </Typography>

      {/* Statistics Section */}
      {listing && (
        <Paper sx={{ p: 3, mt: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Listing Statistics
            </Typography>
            
            {/* Year Filter */}
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel id="year-select-label">Filter by Year</InputLabel>
              <Select
                labelId="year-select-label"
                id="year-select"
                value={selectedYear}
                label="Filter by Year"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {getAvailableYears().map(year => (
                  <MenuItem key={year} value={year}>
                    {year === new Date().getFullYear() ? `${year} (Current Year)` : year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Listed Since
              </Typography>
              <Typography variant="h6">
                {listing.postedOn 
                  ? new Date(listing.postedOn).toLocaleDateString()
                  : 'N/A'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Days Booked ({selectedYear})
              </Typography>
              <Typography variant="h6">
                                {(() => {
                  const acceptedBookings = bookings.filter(b => b.status === 'accepted');
                  
                  return acceptedBookings.reduce((sum, b) => {
                    const startDate = b.dateRange?.start_day || b.dateRange?.start;
                    const endDate = b.dateRange?.end_day || b.dateRange?.end;
                    
                    if (!startDate || !endDate) return sum;
                    
                    const bookingStart = new Date(startDate);
                    const bookingEnd = new Date(endDate);
                    
                    const yearStart = new Date(selectedYear, 0, 1);
                    const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59);
                    
                    const overlapStart = bookingStart > yearStart ? bookingStart : yearStart;
                    const overlapEnd = bookingEnd < yearEnd ? bookingEnd : yearEnd;
                    
                    if (overlapStart <= overlapEnd) {
                      const nights = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
                      return sum + nights;
                    }
                    
                    return sum;
                  }, 0);
                })()}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Profit ({selectedYear})
              </Typography>
              <Typography variant="h6">
                ${(() => {
                  const acceptedBookings = bookings.filter(b => b.status === 'accepted');
                  
                  return acceptedBookings.reduce((sum, b) => {
                    const startDate = b.dateRange?.start_day || b.dateRange?.start;
                    const endDate = b.dateRange?.end_day || b.dateRange?.end;
                    
                    if (!startDate || !endDate) return sum;
                    
                    const bookingStart = new Date(startDate);
                    const bookingEnd = new Date(endDate);
                    
                    const yearStart = new Date(selectedYear, 0, 1);
                    const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59);
                    
                    const overlapStart = bookingStart > yearStart ? bookingStart : yearStart;
                    const overlapEnd = bookingEnd < yearEnd ? bookingEnd : yearEnd;
                    
                    if (overlapStart <= overlapEnd) {
                      const nights = Math.ceil((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
                      return sum + (nights * (listing.price || 0));
                    }
                    
                    return sum;
                  }, 0).toLocaleString();
                })()}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Total Bookings ({selectedYear})
              </Typography>
              <Typography variant="h6">
                {(() => {
                  return bookings.filter(b => {
                    const startDate = b.dateRange?.start_day || b.dateRange?.start;
                    const endDate = b.dateRange?.end_day || b.dateRange?.end;
                    
                    if (!startDate || !endDate) return false;
                    
                    const bookingStart = new Date(startDate);
                    const bookingEnd = new Date(endDate);
                    const yearStart = new Date(selectedYear, 0, 1);
                    const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59);
                    
                    return bookingStart <= yearEnd && bookingEnd >= yearStart;
                  }).length;
                })()}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Pending Requests ({selectedYear})
              </Typography>
              <Typography variant="h6">
                {(() => {
                  return bookings.filter(b => {
                    if (b.status !== 'pending') return false;
                    
                    const startDate = b.dateRange?.start_day || b.dateRange?.start;
                    const endDate = b.dateRange?.end_day || b.dateRange?.end;
                    
                    if (!startDate || !endDate) return false;
                    
                    const bookingStart = new Date(startDate);
                    const bookingEnd = new Date(endDate);
                    const yearStart = new Date(selectedYear, 0, 1);
                    const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59);
                    
                    return bookingStart <= yearEnd && bookingEnd >= yearStart;
                  }).length;
                })()}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {bookings.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No booking requests yet
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Guest Email</TableCell>
                <TableCell>Check-in</TableCell>
                <TableCell>Check-out</TableCell>
                <TableCell>Nights</TableCell>
                <TableCell>Total Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking) => {
                // Safely read date values
                const startDate = booking.dateRange?.start_day || booking.dateRange?.start || 'N/A';
                const endDate = booking.dateRange?.end_day || booking.dateRange?.end || 'N/A';
                
                // Safely calculate nights
                let nights = 'N/A';
                try {
                  if (startDate !== 'N/A' && endDate !== 'N/A') {
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                      nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                    }
                  }
                } catch (e) {
                  console.error('Error calculating nights:', e);
                }
                // Safely read total price
                const price = booking.totalPrice || 0;

                return (
                  <TableRow key={booking.id} hover>
                    <TableCell>{booking.owner}</TableCell>
                    <TableCell>{startDate}</TableCell>
                    <TableCell>{endDate}</TableCell>
                    <TableCell align="center">{nights}</TableCell>
                    <TableCell align="right">
                      ${typeof price === 'number' ? price.toLocaleString() : price}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={booking.status ? booking.status.toUpperCase() : 'UNKNOWN'}
                        color={
                          booking.status === 'accepted'
                            ? 'success'
                            : booking.status === 'declined'
                            ? 'error'
                            : 'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {booking.status === 'pending' ? (
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckIcon />}
                            onClick={() => handleAccept(booking.id)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CloseIcon />}
                            onClick={() => handleDecline(booking.id)}
                          >
                            Decline
                          </Button>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No actions available
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BookingManagementPage;