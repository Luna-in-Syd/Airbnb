import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Snackbar,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BedIcon from '@mui/icons-material/Bed';
import BathtubIcon from '@mui/icons-material/Bathtub';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { useAuth } from '../hooks/useAuth';
import {
  getAllListings,
  getListingById,
  deleteListing,
  publishListing,
  unpublishListing,
} from '../services/listingsService';

import LoadingSpinner from '../components/common/LoadingSpinner';
import StarRating from '../components/common/StarRating';
import PublishListingDialog from '../components/listing/PublishListingDialog';
import ProfitChart from '../components/listing/ProfitChart';

const HostedListingsPage = () => {
  const navigate = useNavigate();
  const { userEmail } = useAuth();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    listingId: null,
    listingTitle: '',
  });
  const [publishDialog, setPublishDialog] = useState({
    open: false,
    listingId: null,
    listingTitle: '',
  });

  // Fetch all listings on mount
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const all = await getAllListings();                 // contains only meta, no published
      const mine = all.filter((l) => l.owner === userEmail);
      const enriched = await Promise.all(
        mine.map(async (m) => {
          const d = await getListingById(m.id);
          return {
            ...d,      // expand detail data first
            id: m.id   // explicitly keep id (override potential missing id)
          };
        })
      );
      setListings(enriched);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to fetch listings',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };



  // Calculate average rating from reviews
  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  };

  // Handle delete listing
  const handleDeleteClick = (listingId, listingTitle) => {
    setDeleteDialog({
      open: true,
      listingId,
      listingTitle,
    });
  };

  const handleDeleteConfirm = async () => {
    const { listingId } = deleteDialog;

    try {
      await deleteListing(listingId);

      // Remove from local state
      setListings((prev) => prev.filter((listing) => listing.id !== listingId));

      setSnackbar({
        open: true,
        message: 'Listing deleted successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete listing',
        severity: 'error',
      });
    } finally {
      setDeleteDialog({ open: false, listingId: null, listingTitle: '' });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, listingId: null, listingTitle: '' });
  };

  // Handle publish listing
  const handlePublishClick = (listingId, listingTitle) => {
    setPublishDialog({
      open: true,
      listingId,
      listingTitle,
    });
  };

  const handlePublishConfirm = async (availability) => {
    const { listingId } = publishDialog;

    try {
      await publishListing(listingId, availability);

      // Refresh listings to show updated published status
      await fetchListings();

      setSnackbar({
        open: true,
        message: 'Listing published successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to publish listing',
        severity: 'error',
      });
    } finally {
      setPublishDialog({ open: false, listingId: null, listingTitle: '' });
    }
  };

  const handlePublishCancel = () => {
    setPublishDialog({ open: false, listingId: null, listingTitle: '' });
  };

  // Handle unpublish listing
  const handleUnpublish = async (listingId) => {
    try {
      await unpublishListing(listingId);

      // Refresh listings to show updated published status
      await fetchListings();

      setSnackbar({
        open: true,
        message: 'Listing unpublished successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to unpublish listing',
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

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header with Create New Listing button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            My Hosted Listings
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/listings/new')}
            aria-label="Create new listing"
          >
            Create New Listing
          </Button>
        </Box>

        {/* Profit Chart */}
        {listings.length > 0 && (
          <ProfitChart listings={listings} />
        )}

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              You haven&apos;t created any listings yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start by creating your first listing to host on AirBrB
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/listings/new')}
            >
              Create Your First Listing
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {listings.map((listing) => {
              const avgRating = calculateAverageRating(listing.reviews);
              const numReviews = listing.reviews ? listing.reviews.length : 0;
              const metadata = listing.metadata || {};
              const propertyType = metadata.propertyType || 'Property';
              const numBeds = Array.isArray(metadata.bedrooms)
                ? metadata.bedrooms.reduce((sum, room) => sum + (room.beds || 0), 0)
                : 0;
              const numBathrooms = metadata.bathrooms || 0;

              return (
                <Grid item xs={12} sm={6} md={4} key={listing.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                  >
                    {/* Thumbnail with YouTube indicator */}
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={listing.thumbnail || '/placeholder-image.jpg'}
                        alt={listing.title}
                        sx={{ objectFit: 'cover' }}
                      />

                      {/* YouTube indicator */}
                      {listing.metadata?.thumbnailType === 'youtube' && (
                        <Chip
                          icon={<YouTubeIcon />}
                          label="YouTube"
                          size="small"
                          color="error"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          }}
                        />
                      )}
                    </Box>

                    <CardContent sx={{ flexGrow: 1 }}>
                      {/* Title */}
                      <Typography variant="h6" component="h2" gutterBottom noWrap>
                        {listing.title}
                      </Typography>

                      {/* Property Type and Published Status */}
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={propertyType}
                          size="small"
                        />
                        {listing.published && (
                          <Chip
                            label="Published"
                            size="small"
                            color="success"
                          />
                        )}
                        {!listing.published && (
                          <Chip
                            label="Unpublished"
                            size="small"
                            color="default"
                            variant="outlined"
                          />
                        )}
                      </Box>

                      {/* Beds and Bathrooms */}
                      <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BedIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {numBeds} {numBeds === 1 ? 'bed' : 'beds'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BathtubIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {numBathrooms} {numBathrooms === 1 ? 'bath' : 'baths'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Rating and Reviews */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <StarRating rating={avgRating} size="small" />
                        <Typography variant="body2" fontWeight="bold">
                          {avgRating > 0 ? avgRating : 'No rating'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ({numReviews} {numReviews === 1 ? 'review' : 'reviews'})
                        </Typography>
                      </Box>

                      {/* Price */}
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        ${listing.price}
                        <Typography component="span" variant="body2" color="text.secondary">
                          {' '}/ night
                        </Typography>
                      </Typography>
                    </CardContent>
                  <CardActions sx={{ flexDirection: 'column', gap: 1, px: 2, pb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => navigate(`/listings/edit/${listing.id}`)}
                      aria-label={`Edit ${listing.title}`}
                    >
                      Edit
                    </Button>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteClick(listing.id, listing.title)}
                      aria-label={`Delete ${listing.title}`}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  {/* Add this button - between Edit/Delete and Publish/Unpublish */}
                  <Button
                    fullWidth
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate(`/listings/${listing.id}/bookings`)}
                    aria-label={`View bookings for ${listing.title}`}
                  >
                    View Bookings
                  </Button>

                  {/* Publish/Unpublish buttons remain unchanged */}
                  {listing.published ? (
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      color="warning"
                      onClick={() => handleUnpublish(listing.id)}
                      aria-label={`Unpublish ${listing.title}`}
                    >
                      Unpublish
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handlePublishClick(listing.id, listing.title)}
                      aria-label={`Publish ${listing.title}`}
                    >
                      Publish
                    </Button>
                  )}
                  </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete Listing</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &quot;{deleteDialog.listingTitle}&quot;?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <PublishListingDialog
        open={publishDialog.open}
        onClose={handlePublishCancel}
        onPublish={handlePublishConfirm}
        listingTitle={publishDialog.listingTitle}
      />
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
    </>
  );
};
export default HostedListingsPage;
