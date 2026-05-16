import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Badge,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EmailIcon from '@mui/icons-material/Email';
import HomeIcon from '@mui/icons-material/Home';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import EditIcon from '@mui/icons-material/Edit';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonIcon from '@mui/icons-material/Person';
import CakeIcon from '@mui/icons-material/Cake';
import WcIcon from '@mui/icons-material/Wc';
import BadgeIcon from '@mui/icons-material/Badge';
import { getAllListings } from '../services/listingsService';
import { getAllBookings } from '../services/bookingsService';
import { getUserProfile, updateUserProfile } from '../services/userService';

const AccountPage = () => {
  const { userEmail, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalListings: 0,
    publishedListings: 0,
    totalBookings: 0,
    pendingBookings: 0,
    acceptedBookings: 0,
    totalEarnings: 0,
  });
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [userName, setUserName] = useState(''); // Display name shown in Profile Header
  const [tempUserName, setTempUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [myBookingsWithListings, setMyBookingsWithListings] = useState([]);
  
  // Profile data states
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: '',  // Legal Name (different from userName/display name)
    birthday: '',
    gender: '',
    title: '',
  });
  const [tempProfile, setTempProfile] = useState({
    name: '',  // Legal Name (different from userName/display name)
    birthday: '',
    gender: '',
    title: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // Load user data from localStorage using user-specific keys
    const storedName = localStorage.getItem(`userName_${userEmail}`);
    const storedAvatar = localStorage.getItem(`userAvatar_${userEmail}`);
    
    if (storedName) {
      setUserName(storedName);
    }
    if (storedAvatar) {
      setAvatarUrl(storedAvatar);
    }

    // Load user profile data
    loadUserProfile();
    fetchAccountStats();
  }, [isAuthenticated, navigate]);

  const loadUserProfile = async () => {
    try {
      // Try to load from localStorage first
      const storedProfile = localStorage.getItem(`userProfile_${userEmail}`);
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setUserProfile(profile);
        // Note: userName is loaded separately and should not be overwritten
      } else {
        // Initialize with default values
        const defaultProfile = {
          name: '',  // Legal Name is independent from userName
          birthday: '',
          gender: '',
          title: '',
        };
        setUserProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const fetchAccountStats = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== Starting to fetch account stats ===');
      console.log('Current user email:', userEmail);

      // Fetch all listings
      let allListings = [];
      try {
        const listingsResponse = await getAllListings();
        console.log('Raw listings response:', listingsResponse);
        
        // Handle different response formats
        if (Array.isArray(listingsResponse)) {
          allListings = listingsResponse;
        } else if (listingsResponse && Array.isArray(listingsResponse.listings)) {
          allListings = listingsResponse.listings;
        } else if (listingsResponse && listingsResponse.data && Array.isArray(listingsResponse.data)) {
          allListings = listingsResponse.data;
        }
        
        console.log('All listings:', allListings);
      } catch (listingsErr) {
        console.error('Error fetching listings:', listingsErr);
        allListings = [];
      }

      // Filter user's listings
      const userListings = allListings.filter(
        (listing) => listing && listing.owner === userEmail
      );
      console.log('User listings:', userListings);
      console.log('User listings count:', userListings.length);

      // Check published status - try different possible field names
      const publishedListings = userListings.filter((listing) => {
        // Log the first listing to see its structure
        if (userListings.indexOf(listing) === 0) {
          console.log('Sample listing structure:', listing);
          console.log('Published field:', listing.published);
          console.log('Metadata:', listing.metadata);
        }
        
        // Check multiple possible ways published could be stored
        return listing.published === true || 
               listing.published === 'true' ||
               (listing.metadata && listing.metadata.published === true) ||
               (listing.metadata && listing.metadata.published === 'true');
      });
      console.log('Published listings:', publishedListings);
      console.log('Published listings count:', publishedListings.length);

      // Fetch all bookings
      let allBookings = [];
      try {
        const bookingsResponse = await getAllBookings();
        console.log('Raw bookings response:', bookingsResponse);
        
        // Handle different response formats
        if (Array.isArray(bookingsResponse)) {
          allBookings = bookingsResponse;
        } else if (bookingsResponse && Array.isArray(bookingsResponse.bookings)) {
          allBookings = bookingsResponse.bookings;
        } else if (bookingsResponse && bookingsResponse.data && Array.isArray(bookingsResponse.data)) {
          allBookings = bookingsResponse.data;
        }
        
        console.log('All bookings:', allBookings);
        console.log('Total bookings count:', allBookings.length);
        
        // Log sample booking structure
        if (allBookings.length > 0) {
          console.log('Sample booking structure:', allBookings[0]);
        }
      } catch (bookingsErr) {
        console.error('Error fetching bookings:', bookingsErr);
        allBookings = [];
      }

      // Get user's listing IDs
      const userListingIds = userListings.map(listing => String(listing.id));
      console.log('User listing IDs:', userListingIds);

      // Filter bookings for user's listings (bookings made BY OTHERS for MY listings)
      // OR bookings made BY ME
      const userRelatedBookings = allBookings.filter((booking) => {
        if (!booking) return false;
        
        // Booking made by this user
        const madeByUser = booking.owner === userEmail;
        
        // Booking for this user's listing
        const forUserListing = userListingIds.includes(String(booking.listingId));
        
        // Log for debugging
        if (madeByUser || forUserListing) {
          console.log('Related booking:', {
            id: booking.id,
            owner: booking.owner,
            listingId: booking.listingId,
            madeByUser,
            forUserListing
          });
        }
        
        return madeByUser || forUserListing;
      });
      
      console.log('User related bookings:', userRelatedBookings);
      console.log('User related bookings count:', userRelatedBookings.length);

      const pendingBookings = userRelatedBookings.filter(
        (booking) => booking && booking.status === 'pending'
      );
      console.log('Pending bookings count:', pendingBookings.length);

      const acceptedBookings = userRelatedBookings.filter(
        (booking) => booking && booking.status === 'accepted'
      );
      console.log('Accepted bookings count:', acceptedBookings.length);

      // Calculate total earnings (only from bookings made BY OTHERS for MY listings)
      const bookingsForMyListings = allBookings.filter((booking) => {
        if (!booking) return false;
        // Only bookings for my listings (not bookings made by me)
        return userListingIds.includes(String(booking.listingId)) && booking.owner !== userEmail;
      });
      console.log('Bookings for my listings (by others):', bookingsForMyListings);

      // Calculate earnings from accepted bookings only
      const totalEarnings = bookingsForMyListings
        .filter(booking => booking.status === 'accepted')
        .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
      console.log('Total earnings:', totalEarnings);

      const newStats = {
        totalListings: userListings.length,
        publishedListings: publishedListings.length,
        totalBookings: userRelatedBookings.length,
        pendingBookings: pendingBookings.length,
        acceptedBookings: acceptedBookings.length,
        totalEarnings: totalEarnings,
      };

      console.log('=== Final stats ===');
      console.log(newStats);
      setStats(newStats);

      // Get bookings made BY this user (not bookings for their listings)
      const myBookings = allBookings.filter((booking) => booking && booking.owner === userEmail);
      console.log('My bookings:', myBookings);

      // Fetch listing details for each booking
      const bookingsWithDetails = await Promise.all(
        myBookings.map(async (booking) => {
          try {
            // Find the listing in allListings array
            const listing = allListings.find(l => String(l.id) === String(booking.listingId));
            return {
              ...booking,
              listingTitle: listing?.title || 'Unknown Listing',
              listingAddress: listing?.address || {},
            };
          } catch (error) {
            console.error('Error fetching listing for booking:', booking.id, error);
            return {
              ...booking,
              listingTitle: 'Unknown Listing',
              listingAddress: {},
            };
          }
        })
      );

      console.log('Bookings with details:', bookingsWithDetails);
      setMyBookingsWithListings(bookingsWithDetails);
    } catch (err) {
      console.error('=== Critical error ===');
      console.error('Error:', err);
      console.error('Stack:', err.stack);
      setError('Failed to load account statistics. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditName = () => {
    setTempUserName(userName);
    setOpenEditDialog(true);
  };

  const handleSaveName = () => {
    setUserName(tempUserName);
    localStorage.setItem(`userName_${userEmail}`, tempUserName);
    setOpenEditDialog(false);
  };

  const handleCloseDialog = () => {
    setOpenEditDialog(false);
    setTempUserName('');
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setAvatarUrl(base64String);
        localStorage.setItem(`userAvatar_${userEmail}`, base64String);
        window.dispatchEvent(new Event('avatarUpdate'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenProfileDialog = () => {
    setTempProfile({ ...userProfile });
    setOpenProfileDialog(true);
  };

  const handleCloseProfileDialog = () => {
    setOpenProfileDialog(false);
    setTempProfile({ ...userProfile });
  };

  const handleSaveProfile = async () => {
    try {
      // Save to localStorage
      localStorage.setItem(`userProfile_${userEmail}`, JSON.stringify(tempProfile));
      setUserProfile(tempProfile);
      
      // Note: userName (display name in header) remains independent
      // It can only be changed through the "Edit Name" button
      
      // Optionally, save to backend
      // await updateUserProfile(tempProfile);
      
      setOpenProfileDialog(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const handleProfileChange = (field, value) => {
    setTempProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Profile Header */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          mb: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <IconButton
                component="label"
                sx={{
                  bgcolor: 'white',
                  width: 40,
                  height: 40,
                  '&:hover': { bgcolor: 'grey.200' },
                }}
              >
                <CameraAltIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
              </IconButton>
            }
          >
            <Avatar
              src={avatarUrl}
              sx={{
                width: 120,
                height: 120,
                bgcolor: 'white',
                color: 'primary.main',
                fontSize: '3rem',
                fontWeight: 'bold',
                border: '4px solid white',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              }}
            >
              {!avatarUrl && (userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase())}
            </Avatar>
          </Badge>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
                {userName || 'User'}
              </Typography>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={handleEditName}
                variant="contained"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'grey.100' },
                }}
              >
                Edit Name
              </Button>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon />
              <Typography variant="h6">
                {userEmail}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Account Profile Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Account Profile
          </Typography>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={handleOpenProfileDialog}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
            }}
          >
            Edit Profile
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          {/* Legal Name */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <PersonIcon sx={{ mr: 2, color: 'primary.main', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Legal Name
                </Typography>
                <Typography variant="h6">
                  {userProfile.name || 'Not set'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Birthday */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <CakeIcon sx={{ mr: 2, color: 'primary.main', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Birthday
                </Typography>
                <Typography variant="h6">
                  {userProfile.birthday ? new Date(userProfile.birthday).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Not set'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Gender */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <WcIcon sx={{ mr: 2, color: 'primary.main', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Gender
                </Typography>
                <Typography variant="h6">
                  {userProfile.gender || 'Not set'}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Title/Salutation */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <BadgeIcon sx={{ mr: 2, color: 'primary.main', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Title
                </Typography>
                <Typography variant="h6">
                  {userProfile.title || 'Not set'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Account Statistics - Merged Card */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          Account Statistics
        </Typography>

        <Grid container spacing={3} justifyContent="center">
          {/* Total Listings */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={2}
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >

              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <HomeIcon sx={{ fontSize: 32, mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    My Listings
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Total Listings</Typography>
                  <Chip 
                    label={stats.totalListings} 
                    sx={{ 
                      bgcolor: 'white',
                      color: 'primary.main',
                      fontWeight: 'bold',
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Bookings */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={2}
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BookmarkIcon sx={{ fontSize: 32, mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    My Bookings
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Total Bookings</Typography>
                  <Chip 
                    label={stats.totalBookings} 
                    sx={{ 
                      bgcolor: 'white',
                      color: '#f5576c',
                      fontWeight: 'bold',
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Pending Bookings */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={2}
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)',
                color: 'white',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PendingIcon sx={{ fontSize: 32, mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Pending
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Pending Bookings</Typography>
                  <Chip 
                    label={stats.pendingBookings} 
                    sx={{ 
                      bgcolor: 'white',
                      color: '#fb8c00',
                      fontWeight: 'bold',
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Earnings */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={2}
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: 'white',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoneyIcon sx={{ fontSize: 32, mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Earnings
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Total Earnings</Typography>
                  <Chip 
                    label={`$${stats.totalEarnings.toLocaleString()}`}
                    sx={{ 
                      bgcolor: 'white',
                      color: '#11998e',
                      fontWeight: 'bold',
                    }} 
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* My Bookings Details */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          My Bookings
        </Typography>

        {myBookingsWithListings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <BookmarkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              You haven't made any bookings yet
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {myBookingsWithListings.map((booking) => (
              <Grid item xs={12} md={6} lg={4} key={booking.id}>
                <Card 
                  elevation={2}
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent>
                    {/* Status Badge */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip
                        label={booking.status?.toUpperCase() || 'UNKNOWN'}
                        size="small"
                        color={
                          booking.status === 'accepted'
                            ? 'success'
                            : booking.status === 'pending'
                            ? 'warning'
                            : 'error'
                        }
                        icon={
                          booking.status === 'accepted' ? (
                            <CheckCircleIcon />
                          ) : booking.status === 'pending' ? (
                            <PendingIcon />
                          ) : null
                        }
                      />
                    </Box>

                    {/* Listing Title */}
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        fontWeight: 'bold',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {booking.listingTitle}
                    </Typography>
                    {/* Address */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <LocationOnIcon sx={{ fontSize: 20, mr: 0.5, color: 'text.secondary', flexShrink: 0 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                        {booking.listingAddress?.street && `${booking.listingAddress.street}, `}
                        {booking.listingAddress?.city && `${booking.listingAddress.city}, `}
                        {booking.listingAddress?.state && `${booking.listingAddress.state} `}
                        {booking.listingAddress?.postcode && booking.listingAddress.postcode}
                        {!booking.listingAddress?.street && !booking.listingAddress?.city && 'Address not available'}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Booking Dates */}
                    {booking.dateRange && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Check-in to Check-out
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {new Date(booking.dateRange.start_day || booking.dateRange.start).toLocaleDateString()} - {new Date(booking.dateRange.end_day || booking.dateRange.end).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}

                    {/* Total Price */}
                    {booking.totalPrice && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Total Price
                        </Typography>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                          ${booking.totalPrice.toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Account Actions */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Quick Actions
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/my-listings')}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
              },
            }}
          >
            Manage My Listings
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<AccountCircleIcon />}
            onClick={() => navigate('/')}
            sx={{
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              },
            }}
          >
            Browse All Listings
          </Button>
        </Box>
      </Paper>

      {/* Edit Name Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Your Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            variant="outlined"
            value={tempUserName}
            onChange={(e) => setTempUserName(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveName} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={openProfileDialog} onClose={handleCloseProfileDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Account Profile</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Legal Name */}
            <TextField
              label="Legal Name"
              type="text"
              fullWidth
              variant="outlined"
              value={tempProfile.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
              InputProps={{
                startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            {/* Birthday */}
            <TextField
              label="Birthday"
              type="date"
              fullWidth
              variant="outlined"
              value={tempProfile.birthday}
              onChange={(e) => handleProfileChange('birthday', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              InputProps={{
                startAdornment: <CakeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            {/* Gender */}
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={tempProfile.gender}
                label="Gender"
                onChange={(e) => handleProfileChange('gender', e.target.value)}
                startAdornment={<WcIcon sx={{ ml: 1, mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="">
                  <em>Not specified</em>
                </MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Non-binary">Non-binary</MenuItem>
                <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            {/* Title/Salutation */}
            <FormControl fullWidth>
              <InputLabel>Title</InputLabel>
              <Select
                value={tempProfile.title}
                label="Title"
                onChange={(e) => handleProfileChange('title', e.target.value)}
                startAdornment={<BadgeIcon sx={{ ml: 1, mr: 1, color: 'text.secondary' }} />}
              >
                <MenuItem value="">
                  <em>Not specified</em>
                </MenuItem>
                <MenuItem value="Mr.">Mr.</MenuItem>
                <MenuItem value="Mrs.">Mrs.</MenuItem>
                <MenuItem value="Ms.">Ms.</MenuItem>
                <MenuItem value="Miss">Miss</MenuItem>
                <MenuItem value="Dr.">Dr.</MenuItem>
                <MenuItem value="Prof.">Prof.</MenuItem>
                <MenuItem value="Mx.">Mx.</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProfileDialog}>Cancel</Button>
          <Button onClick={handleSaveProfile} variant="contained">
            Save Profile
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AccountPage;