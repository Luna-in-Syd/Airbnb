import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Chip,
  Button,
  TextField,
  Rating,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  ImageList,
  ImageListItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BedIcon from '@mui/icons-material/Bed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StarIcon from '@mui/icons-material/Star';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { getListingById } from '../services/listingsService';
import { makeBooking, getMyBookings } from '../services/bookingsService';
import { addReview } from '../services/listingsService';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StarRating from '../components/common/StarRating';

const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, userEmail } = useAuth();

  // Listing data
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking states
  const [myBookings, setMyBookings] = useState([]);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [bookingDates, setBookingDates] = useState({
    startDate: '',
    endDate: '',
  });

  // Review states
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
  });
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all', 5, 4, 3, 2, 1

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Store search dates from navigation state
  const [searchDates, setSearchDates] = useState(null);

  // Fetch listing data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const listingData = await getListingById(id);
        console.log('Fetched listing data:', listingData);
        setListing(listingData);

        // Get search dates from navigation state if available
        const state = window.history.state?.usr;
        if (state?.startDate && state?.endDate) {
          setSearchDates({
            startDate: state.startDate,
            endDate: state.endDate,
          });
        }

        // If user is logged in, fetch their bookings
        if (isAuthenticated) {
          await fetchMyBookings();
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
        setSnackbar({
          open: true,
          message: error.message || 'Failed to load listing',
          severity: 'error',
        });
        setTimeout(() => navigate('/'), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isAuthenticated, navigate]);

  // Fetch user's bookings
  const fetchMyBookings = async () => {
    try {
      const bookings = await getMyBookings();
      console.log('Fetched bookings:', bookings);
      // Filter bookings for this listing
      const listingBookings = bookings.filter((b) => b.listingId === id);
      setMyBookings(listingBookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    }
  };

  // Calculate average rating
  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  };

  // Calculate rating distribution
  const calculateRatingDistribution = (reviews) => {
    if (!reviews || reviews.length === 0) {
      return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      const rating = Math.round(review.rating || 0);
      if (rating >= 1 && rating <= 5) {
        distribution[rating]++;
      }
    });

    return distribution;
  };

  // Calculate total beds - compatible with two data formats
  const calculateTotalBeds = (metadata) => {
    // Method 1: if metadata.beds exists, use it directly
    if (metadata?.beds !== undefined) {
      return metadata.beds;
    }
    // Method 2: compute from bedrooms array
    if (metadata?.bedrooms && Array.isArray(metadata.bedrooms)) {
      return metadata.bedrooms.reduce((sum, bedroom) => sum + (bedroom.beds || 0), 0);
    }
    return 0;
  };

  // Calculate price for stay
  const calculateStayPrice = () => {
    if (!searchDates || !listing) return null;

    const start = new Date(searchDates.startDate);
    const end = new Date(searchDates.endDate);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    return {
      nights,
      totalPrice: nights * listing.price,
    };
  };

  // Handle booking
  const handleBookingOpen = () => {
    if (!isAuthenticated) {
      setSnackbar({
        open: true,
        message: 'Please login to make a booking',
        severity: 'warning',
      });
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    // Pre-fill dates if from search
    if (searchDates) {
      setBookingDates(searchDates);
    }

    setBookingDialog(true);
  };

  const handleBookingClose = () => {
    setBookingDialog(false);
    setBookingDates({ startDate: '', endDate: '' });
  };

  const handleBookingSubmit = async () => {
    try {
      // Validate dates
      if (!bookingDates.startDate || !bookingDates.endDate) {
        setSnackbar({
          open: true,
          message: 'Please select both start and end dates',
          severity: 'error',
        });
        return;
      }

      const start = new Date(bookingDates.startDate);
      const end = new Date(bookingDates.endDate);

      if (start >= end) {
        setSnackbar({
          open: true,
          message: 'End date must be after start date',
          severity: 'error',
        });
        return;
      }

      // Calculate total price
      const start_day = new Date(bookingDates.startDate);
      const end_day = new Date(bookingDates.endDate);
      const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const totalPrice = nights * (listing?.price || 0);

      console.log('Booking details:', {
        nights,
        pricePerNight: listing?.price,
        totalPrice,
        dateRange: {
          start_day: bookingDates.startDate,
          end_day: bookingDates.endDate,
        }
      });

      await makeBooking(id, {
        dateRange: {
          start_day: bookingDates.startDate,
          end_day: bookingDates.endDate,
        },
        totalPrice: totalPrice,
      });

      setSnackbar({
        open: true,
        message: 'Booking request submitted successfully!',
        severity: 'success',
      });

      handleBookingClose();
      await fetchMyBookings();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to make booking',
        severity: 'error',
      });
    }
  };

  // Handle review
  const handleReviewOpen = (bookingId) => {
    setSelectedBookingId(bookingId);
    setReviewDialog(true);
  };

  const handleReviewClose = () => {
    setReviewDialog(false);
    setReviewData({ rating: 5, comment: '' });
    setSelectedBookingId(null);
  };

  const handleReviewSubmit = async () => {
    try {
      if (!reviewData.comment.trim()) {
        setSnackbar({
          open: true,
          message: 'Please write a comment',
          severity: 'error',
        });
        return;
      }

      await addReview(id, selectedBookingId, {
        rating: reviewData.rating,
        comment: reviewData.comment,
      });

      setSnackbar({
        open: true,
        message: 'Review submitted successfully!',
        severity: 'success',
      });

      handleReviewClose();

      // Refresh listing to show new review
      const updatedListing = await getListingById(id);
      setListing(updatedListing);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to submit review',
        severity: 'error',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!listing) {
    return (
      <Container>
        <Typography variant="h6" sx={{ mt: 4 }}>
          Listing not found
        </Typography>
      </Container>
    );
  }

  // Compatible with different data structures
  const metadata = listing.metadata || {};
  const address = listing.address || {};
  const reviews = listing.reviews || [];
  const avgRating = calculateAverageRating(reviews);
  const ratingDistribution = calculateRatingDistribution(reviews);
  const totalBeds = calculateTotalBeds(metadata);
  const numBedrooms = metadata.bedrooms?.length || 0;
  const numBathrooms = metadata.bathrooms || 0;
  const stayPrice = calculateStayPrice();

  // Check if user has accepted bookings for this listing
  const acceptedBookings = myBookings.filter((b) => b.status === 'accepted');
  const canLeaveReview = acceptedBookings.length > 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ mb: 2 }}
      >
        Back to Listings
      </Button>

      {/* Title and Rating */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {listing.title || 'Untitled Listing'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Tooltip
            title={
              <Box sx={{ p: 1, minWidth: 250 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
                  Rating Distribution
                </Typography>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingDistribution[star];
                  const percentage = reviews.length > 0 ? ((count / reviews.length) * 100).toFixed(1) : 0;
                  return (
                    <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="body2" sx={{ minWidth: 60 }}>
                        {star} {star === 1 ? 'star' : 'stars'}
                      </Typography>
                      <Box sx={{ flex: 1, mx: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat(percentage)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: star >= 4 ? '#4caf50' : star >= 3 ? '#ff9800' : '#f44336',
                            },
                          }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'right' }}>
                        {count} ({percentage}%)
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            }
            arrow
            placement="bottom-start"
            componentsProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  '& .MuiTooltip-arrow': {
                    color: 'rgba(0, 0, 0, 0.9)',
                  },
                },
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
              <StarRating rating={avgRating} size="medium" />
              <Typography variant="h6" fontWeight="bold">
                {avgRating > 0 ? avgRating : 'No rating'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </Typography>
            </Box>
          </Tooltip>
          <Chip icon={<HomeIcon />} label={metadata.propertyType || 'Property'} />
        </Box>

        {/* Address */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOnIcon color="action" />
          <Typography variant="body1" color="text.secondary">
            {address.street && `${address.street}, `}
            {address.city && `${address.city}, `}
            {address.state && `${address.state} `}
            {address.postcode && `${address.postcode}, `}
            {address.country || 'Address not available'}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Images and Details */}
        <Grid item xs={12} md={8}>
          {/* Main Image or YouTube Video */}
          <Paper sx={{ mb: 3 }}>
            {listing.metadata?.thumbnailType === 'youtube' && listing.metadata?.youtubeId ? (
              // YouTube video player
              <Box>
                <Box
                  sx={{
                    position: 'relative',
                    paddingBottom: '56.25%', // 16:9 aspect ratio
                    height: 0,
                    overflow: 'hidden',
                    backgroundColor: '#000',
                  }}
                >
                  <iframe
                    src={`https://www.youtube.com/embed/${listing.metadata.youtubeId}`}
                    title={`${listing.title} - YouTube Video`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                    }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </Box>
                <Box sx={{ p: 2, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <YouTubeIcon color="error" />
                  <Typography variant="body2" color="text.secondary">
                    Click play to watch the property video tour
                  </Typography>
                </Box>
              </Box>
            ) : (
              // Traditional image display
              <Box
                component="img"
                src={listing.thumbnail || 'https://via.placeholder.com/800x400?text=No+Image'}
                alt={listing.title}
                sx={{
                  width: '100%',
                  height: 400,
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/800x400?text=No+Image';
                }}
              />
            )}
          </Paper>

          {/* Additional Images */}
          {metadata.images && metadata.images.length > 0 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Property Images
              </Typography>
              <ImageList cols={3} gap={8}>
                {metadata.images.map((image, index) => (
                  <ImageListItem key={index}>
                    <img
                      src={image}
                      alt={`Property ${index + 1}`}
                      style={{ height: 200, objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200?text=No+Image';
                      }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Paper>
          )}

          {/* Property Details */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Property Details
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BedIcon color="primary" />
                  <Box>
                    <Typography variant="h6">{totalBeds}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {totalBeds === 1 ? 'Bed' : 'Beds'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HomeIcon color="primary" />
                  <Box>
                    <Typography variant="h6">{numBedrooms}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {numBedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BathtubIcon color="primary" />
                  <Box>
                    <Typography variant="h6">{numBathrooms}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {numBathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Bedrooms Breakdown */}
            {metadata.bedrooms && metadata.bedrooms.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Bedrooms
                </Typography>
                <Grid container spacing={2}>
                  {metadata.bedrooms.map((bedroom, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {bedroom.type || `Bedroom ${index + 1}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {bedroom.beds} {bedroom.beds === 1 ? 'bed' : 'beds'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>

          {/* Amenities */}
          {metadata.amenities && metadata.amenities.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Amenities
              </Typography>
              <List>
                {metadata.amenities.map((amenity, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={amenity} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Reviews Section */}
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h5">
                Reviews ({reviews.length})
              </Typography>
              {canLeaveReview && (
                <Button
                  variant="outlined"
                  onClick={() => handleReviewOpen(acceptedBookings[0].id)}
                >
                  Leave a Review
                </Button>
              )}
            </Box>

            {/* Star Rating Filter */}
            <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Filter by rating:
              </Typography>
              <Chip
                label="All"
                onClick={() => setReviewFilter('all')}
                color={reviewFilter === 'all' ? 'primary' : 'default'}
                variant={reviewFilter === 'all' ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer' }}
              />
              {[5, 4, 3, 2, 1].map((star) => {
                const starCount = ratingDistribution[star];
                return (
                  <Chip
                    key={star}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <span>{star}</span>
                        <StarIcon sx={{ fontSize: 16 }} />
                        <span style={{ fontSize: '0.85em', opacity: 0.7 }}>({starCount})</span>
                      </Box>
                    }
                    onClick={() => setReviewFilter(star)}
                    color={reviewFilter === star ? 'primary' : 'default'}
                    variant={reviewFilter === star ? 'filled' : 'outlined'}
                    sx={{ cursor: 'pointer' }}
                  />
                );
              })}
            </Box>

            {reviews.length === 0 ? (
              <Typography color="text.secondary">
                No reviews yet. Be the first to review!
              </Typography>
            ) : (
              <Stack spacing={2}>
                {reviews
                  .filter((review) => {
                    if (reviewFilter === 'all') return true;
                    return Math.round(review.rating) === reviewFilter;
                  })
                  .map((review, index) => (
                    <Card key={index} variant="outlined">
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold">
                            {review.email || 'Anonymous'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <StarIcon color="primary" fontSize="small" />
                            <Typography variant="body2" fontWeight="bold">
                              {review.rating}/5
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {review.comment}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                {reviews.filter((review) => {
                  if (reviewFilter === 'all') return true;
                  return Math.round(review.rating) === reviewFilter;
                }).length === 0 && (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No reviews with {reviewFilter} star{reviewFilter !== 1 ? 's' : ''} rating.
                  </Typography>
                )}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Booking Card */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            {/* Price */}
            <Box sx={{ mb: 3 }}>
              {stayPrice ? (
                <>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    ${stayPrice.totalPrice}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    for {stayPrice.nights} {stayPrice.nights === 1 ? 'night' : 'nights'}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h4" color="primary" fontWeight="bold">
                    ${listing.price || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    per night
                  </Typography>
                </>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Booking Button */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleBookingOpen}
              sx={{ mb: 2 }}
            >
              {isAuthenticated ? 'Book Now' : 'Login to Book'}
            </Button>

            {/* My Bookings for this listing */}
            {(() => {
          // Fix: filter only by listingId, remove incorrect owner check
          const currentUserEmail = userEmail || localStorage.getItem('userEmail');
          const myListingBookings = myBookings.filter(booking =>
            String(booking.listingId) === String(id)
          );

          // Debug log (improved version)
          console.log('Debug Booking Display:', {
            currentListingId: id,
            currentUserEmail,
            allMyBookings: myBookings,
            filteredBookings: myListingBookings,
          });

          return myListingBookings.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Booking Information
              </Typography>
              <Stack spacing={1}>
                {myListingBookings.map((booking) => {
                  // Added: compute dates and number of nights
                  const startDate = new Date(booking.dateRange?.start || booking.dateRange?.start_day);
                  const endDate = new Date(booking.dateRange?.end || booking.dateRange?.end_day);
                  const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

                  return (
                    <Card key={booking.id} variant="outlined">
                      <CardContent sx={{ pb: 1.5, '&:last-child': { pb: 1.5 } }}>
                        {/* Status label */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Chip
                            label={booking.status?.toUpperCase() || 'PENDING'}
                            size="small"
                            color={
                              booking.status === 'accepted'
                                ? 'success'
                                : booking.status === 'pending'
                                ? 'warning'
                                : 'error'
                            }
                          />

                        </Box>

                        {/* Date range */}
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', mb: 0.25 }}>
                          {startDate.getMonth() + 1}/{startDate.getDate()}/{startDate.getFullYear()} -
                          {endDate.getMonth() + 1}/{endDate.getDate()}/{endDate.getFullYear()}
                        </Typography>
                        {/* Number of nights */}
                        <Typography variant="caption" color="text.secondary">
                          {nights} {nights === 1 ? 'night' : 'nights'}
                        </Typography>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          );
        })()}
          </Paper>
        </Grid>
      </Grid>

      {/* Booking Dialog */}
      <Dialog open={bookingDialog} onClose={handleBookingClose} maxWidth="sm" fullWidth>
        <DialogTitle>Make a Booking</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select your check-in and check-out dates
          </Typography>
          <TextField
            label="Check-in Date"
            type="date"
            fullWidth
            value={bookingDates.startDate}
            onChange={(e) =>
              setBookingDates((prev) => ({ ...prev, startDate: e.target.value }))
            }
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Check-out Date"
            type="date"
            fullWidth
            value={bookingDates.endDate}
            onChange={(e) =>
              setBookingDates((prev) => ({ ...prev, endDate: e.target.value }))
            }
            InputLabelProps={{ shrink: true }}
          />
          {bookingDates.startDate && bookingDates.endDate && listing.price && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Total: $
              {Math.ceil(
                (new Date(bookingDates.endDate) - new Date(bookingDates.startDate)) /
                  (1000 * 60 * 60 * 24)
              ) * listing.price}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBookingClose}>Cancel</Button>
          <Button onClick={handleBookingSubmit} variant="contained">
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onClose={handleReviewClose} maxWidth="sm" fullWidth>
        <DialogTitle>Leave a Review</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Rating
            </Typography>
            <Rating
              value={reviewData.rating}
              onChange={(_, newValue) =>
                setReviewData((prev) => ({ ...prev, rating: newValue }))
              }
              size="large"
            />
          </Box>
          <TextField
            label="Your Review"
            multiline
            rows={4}
            fullWidth
            value={reviewData.comment}
            onChange={(e) =>
              setReviewData((prev) => ({ ...prev, comment: e.target.value }))
            }
            placeholder="Share your experience..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReviewClose}>Cancel</Button>
          <Button onClick={handleReviewSubmit} variant="contained">
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ListingDetailPage;
