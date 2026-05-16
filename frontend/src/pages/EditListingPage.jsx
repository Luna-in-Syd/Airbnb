import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Grid,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  InputAdornment,
  FormGroup,
  FormControlLabel,
  Checkbox,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import YouTubeIcon from '@mui/icons-material/YouTube';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { getListingById, updateListing } from '../services/listingsService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PROPERTY_TYPES = [
  'House',
  'Apartment',
  'Condo',
  'Townhouse',
  'Villa',
  'Studio',
  'Other',
];

const BEDROOM_TYPES = [
  'Master Bedroom',
  'Single Bedroom',
  'Shared Bedroom',
  'Guest Bedroom',
  'Children\'s Bedroom',
];

const COMMON_AMENITIES = [
  'WiFi',
  'Kitchen',
  'Washing Machine',
  'Dryer',
  'Air Conditioning',
  'Heating',
  'TV',
  'Parking',
  'Pool',
  'Gym',
  'Elevator',
  'Pet Friendly',
];

const EditListingPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    street: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    price: '',
    thumbnail: '',
    youtubeUrl: '', // New YouTube URL field
    thumbnailType: 'image', // 'image' or 'youtube'
    propertyType: '',
    bathrooms: '',
  });

  const [bedrooms, setBedrooms] = useState([
    { type: 'Master Bedroom', beds: 1 },
  ]);

  const [amenities, setAmenities] = useState([]);
  const [propertyImages, setPropertyImages] = useState([]);

  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch listing data on mount
  useEffect(() => {
    const fetchListingData = async () => {
      setLoading(true);
      try {
        const listing = await getListingById(id);

        // Populate form data
        const address = listing.address || {};
        const metadata = listing.metadata || {};
        
        setFormData({
          title: listing.title || '',
          street: address.street || '',
          city: address.city || '',
          state: address.state || '',
          postcode: address.postcode || '',
          country: address.country || '',
          price: listing.price || '',
          thumbnail: listing.thumbnail || '',
          youtubeUrl: metadata.youtubeUrl || '',
          thumbnailType: metadata.thumbnailType || 'image',
          propertyType: metadata.propertyType || '',
          bathrooms: metadata.bathrooms || '',
        });

        // Populate bedrooms
        if (listing.metadata?.bedrooms && listing.metadata.bedrooms.length > 0) {
          setBedrooms(listing.metadata.bedrooms);
        }

        // Populate amenities
        if (listing.metadata?.amenities) {
          setAmenities(listing.metadata.amenities);
        }

        // Populate property images
        if (listing.metadata?.images) {
          setPropertyImages(listing.metadata.images);
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.message || 'Failed to fetch listing',
          severity: 'error',
        });
        // Navigate back if listing not found
        setTimeout(() => {
          navigate('/my-listings');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchListingData();
  }, [id, navigate]);

  // Handle basic input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle bedroom changes
  const handleBedroomChange = (index, field, value) => {
    const newBedrooms = [...bedrooms];
    newBedrooms[index][field] = value;
    setBedrooms(newBedrooms);
  };

  // Add new bedroom
  const addBedroom = () => {
    setBedrooms([...bedrooms, { type: 'Single Bedroom', beds: 1 }]);
  };

  // Remove bedroom
  const removeBedroom = (index) => {
    if (bedrooms.length > 1) {
      const newBedrooms = bedrooms.filter((_, i) => i !== index);
      setBedrooms(newBedrooms);
    }
    };

  // Handle amenities toggle
  const handleAmenityToggle = (amenity) => {
    setAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity]
    );
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'Image size must be less than 5MB',
          severity: 'error',
        });
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          thumbnail: reader.result,
          thumbnailType: 'image',
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle YouTube URL input
  const handleYoutubeUrlChange = (e) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, youtubeUrl: url }));
    
    // Validate and convert YouTube URL
    if (url) {
      const youtubeId = extractYoutubeId(url);
      if (youtubeId) {
        // Use YouTube thumbnail
        setFormData((prev) => ({ 
          ...prev, 
          thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
          thumbnailType: 'youtube'
        }));
        setErrors((prev) => ({ ...prev, thumbnail: '' }));
      } else {
        setErrors((prev) => ({ ...prev, thumbnail: 'Please enter a valid YouTube URL' }));
      }
    }
  };

  // Extract YouTube video ID
  const extractYoutubeId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  // Toggle thumbnail type
  const handleThumbnailTypeChange = (type) => {
    setFormData((prev) => ({ 
      ...prev, 
      thumbnailType: type,
      thumbnail: type === 'image' ? '' : prev.thumbnail,
      youtubeUrl: type === 'youtube' ? prev.youtubeUrl : ''
    }));
    setErrors((prev) => ({ ...prev, thumbnail: '' }));
  };

  // Handle property images upload
  const handlePropertyImagesUpload = (e) => {
    const files = Array.from(e.target.files || []);

    // Check total number of images
    if (propertyImages.length + files.length > 10) {
      setSnackbar({
        open: true,
        message: 'Maximum 10 property images allowed',
        severity: 'error',
      });
      return;
    }

    // Process each file
    files.forEach((file) => {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: `Image ${file.name} is too large (max 5MB)`,
          severity: 'error',
        });
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setPropertyImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove property image
  const removePropertyImage = (index) => {
    setPropertyImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.postcode.trim()) {
      newErrors.postcode = 'Postcode is required';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.propertyType) {
      newErrors.propertyType = 'Property type is required';
    }

    if (!formData.bathrooms || Number(formData.bathrooms) <= 0) {
      newErrors.bathrooms = 'Number of bathrooms must be at least 1';
    }

    // Validate bedrooms
    if (bedrooms.length === 0) {
      newErrors.bedrooms = 'At least one bedroom is required';
    } else {
      bedrooms.forEach((bedroom, index) => {
        if (!bedroom.beds || Number(bedroom.beds) <= 0) {
          newErrors.bedrooms = `Bedroom ${index + 1} must have at least 1 bed`;
        }
      });
    }

    // Validate thumbnail based on type
    if (formData.thumbnailType === 'image' && !formData.thumbnail) {
      newErrors.thumbnail = 'Please upload a thumbnail image';
    } else if (formData.thumbnailType === 'youtube') {
      if (!formData.youtubeUrl) {
        newErrors.thumbnail = 'Please enter a YouTube URL';
      } else if (!extractYoutubeId(formData.youtubeUrl)) {
        newErrors.thumbnail = 'Please enter a valid YouTube URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields correctly',
        severity: 'error',
      });
      return;
    }

    setSaving(true);
    try {
           // Prepare listing data
      const listingData = {
        title: formData.title.trim(),
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          postcode: formData.postcode.trim(),
          country: formData.country.trim(),
        },
        price: Number(formData.price),
        thumbnail: formData.thumbnail || '/placeholder-image.jpg',
        metadata: {
          propertyType: formData.propertyType,
          bathrooms: Number(formData.bathrooms),
          bedrooms: bedrooms.map((bedroom) => ({
            type: bedroom.type,
            beds: Number(bedroom.beds),
          })),
          amenities,
          beds: bedrooms.reduce((sum, bedroom) => sum + Number(bedroom.beds), 0),
          images: propertyImages,
          // Add YouTube-related information
          thumbnailType: formData.thumbnailType,
          youtubeUrl: formData.thumbnailType === 'youtube' ? formData.youtubeUrl : undefined,
          youtubeId: formData.thumbnailType === 'youtube' ? extractYoutubeId(formData.youtubeUrl) : undefined,
        },
      };

      await updateListing(id, listingData);

      setSnackbar({
        open: true,
        message: 'Listing updated successfully!',
        severity: 'success',
      });

      // Redirect to hosted listings page after short delay
      setTimeout(() => {
        navigate('/my-listings');
      }, 1000);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update listing',
        severity: 'error',
      });
    } finally {
      setSaving(false);
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
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton
              onClick={() => navigate('/my-listings')}
              sx={{ mr: 2 }}
              aria-label="Go back to my listings"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Edit Listing
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Basic Information
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              error={Boolean(errors.title)}
              helperText={errors.title}
              margin="normal"
              required
            />

            <FormControl fullWidth margin="normal" error={Boolean(errors.propertyType)} required>
              <InputLabel>Property Type</InputLabel>
              <Select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                label="Property Type"
              >
                {PROPERTY_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
              {errors.propertyType && (
                <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                  {errors.propertyType}
                </Typography>
              )}
            </FormControl>

            <TextField
              fullWidth
              label="Price per Night"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              error={Boolean(errors.price)}
              helperText={errors.price}
              margin="normal"
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />

            {/* Address */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Address
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <TextField
              fullWidth
              label="Street Address"
              name="street"
              value={formData.street}
              onChange={handleChange}
              error={Boolean(errors.street)}
              helperText={errors.street}
              margin="normal"
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  error={Boolean(errors.city)}
                  helperText={errors.city}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State/Province"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  error={Boolean(errors.state)}
                  helperText={errors.state}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Postcode"
                  name="postcode"
                  value={formData.postcode}
                  onChange={handleChange}
                  error={Boolean(errors.postcode)}
                  helperText={errors.postcode}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  error={Boolean(errors.country)}
                  helperText={errors.country}
                  margin="normal"
                  required
                />
              </Grid>
            </Grid>

            {/* Property Details */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Property Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <TextField
              fullWidth
              label="Number of Bathrooms"
              name="bathrooms"
              type="number"
              value={formData.bathrooms}
              onChange={handleChange}
              error={Boolean(errors.bathrooms)}
              helperText={errors.bathrooms}
              margin="normal"
              required
              inputProps={{ min: 1 }}
            />

            {/* Bedrooms */}
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Bedrooms *
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addBedroom}
                  aria-label="Add bedroom"
                >
                  Add Bedroom
                </Button>
              </Box>

              {bedrooms.map((bedroom, index) => (
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
                    <Typography variant="subtitle2">Bedroom {index + 1}</Typography>
                    {bedrooms.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => removeBedroom(index)}
                        color="error"
                        aria-label={`Remove bedroom ${index + 1}`}
                      >
                        <RemoveIcon />
                      </IconButton>
                    )}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Bedroom Type</InputLabel>
                        <Select
                          value={bedroom.type}
                          onChange={(e) => handleBedroomChange(index, 'type', e.target.value)}
                          label="Bedroom Type"
                        >
                          {BEDROOM_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Number of Beds"
                        type="number"
                        value={bedroom.beds}
                        onChange={(e) => handleBedroomChange(index, 'beds', e.target.value)}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              ))}

              {errors.bedrooms && (
                <Typography variant="caption" color="error">
                  {errors.bedrooms}
                </Typography>
              )}
            </Box>

            {/* Amenities */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
              Amenities
            </Typography>
            <FormGroup>
              <Grid container>
                {COMMON_AMENITIES.map((amenity) => (
                  <Grid item xs={12} sm={6} md={4} key={amenity}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={amenities.includes(amenity)}
                          onChange={() => handleAmenityToggle(amenity)}
                        />
                      }
                      label={amenity}
                    />
                  </Grid>
                ))}
              </Grid>
            </FormGroup>

            {/* Thumbnail */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Thumbnail
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {/* Thumbnail type selector */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Choose thumbnail type:
              </Typography>
              <ToggleButtonGroup
                value={formData.thumbnailType}
                exclusive
                onChange={(e, newType) => newType && handleThumbnailTypeChange(newType)}
                aria-label="thumbnail type"
                fullWidth
              >
                <ToggleButton value="image" aria-label="upload image">
                  <ImageIcon sx={{ mr: 1 }} />
                  Upload Image
                </ToggleButton>
                <ToggleButton value="youtube" aria-label="youtube video">
                  <YouTubeIcon sx={{ mr: 1 }} />
                  YouTube Video
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Image upload option */}
            {formData.thumbnailType === 'image' && (
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ mb: 2 }}
                startIcon={<UploadFileIcon />}
              >
                Upload Thumbnail Image (Max 5MB)
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                />
              </Button>
            )}

            {/* YouTube URL input option */}
            {formData.thumbnailType === 'youtube' && (
              <TextField
                fullWidth
                label="YouTube URL"
                name="youtubeUrl"
                value={formData.youtubeUrl}
                onChange={handleYoutubeUrlChange}
                placeholder="https://www.youtube.com/watch?v=..."
                margin="normal"
                helperText="Enter a YouTube video URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <YouTubeIcon color="error" />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            {/* Error hint */}
            {errors.thumbnail && (
                              <Alert severity="error" sx={{ mb: 2, mt: 2 }}>
                {errors.thumbnail}
              </Alert>
            )}

            {/* Thumbnail preview */}
            {formData.thumbnail && (
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Thumbnail Preview:
                </Typography>
                <Box sx={{ textAlign: 'center' }}>
                  {formData.thumbnailType === 'youtube' && formData.youtubeUrl ? (
                    <Box>
                      {/* YouTube embed */}
                      <Box
                        sx={{
                          position: 'relative',
                          paddingBottom: '56.25%', // 16:9 aspect ratio
                          height: 0,
                          overflow: 'hidden',
                          maxWidth: '100%',
                          background: '#000',
                          borderRadius: '8px',
                          mb: 2,
                        }}
                      >
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYoutubeId(formData.youtubeUrl)}`}
                          title="YouTube video preview"
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            borderRadius: '8px',
                          }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        This YouTube video will be used as the listing thumbnail
                      </Typography>
                    </Box>
                  ) : (
                    <img
                      src={formData.thumbnail}
                      alt="Thumbnail preview"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '300px', 
                        objectFit: 'contain',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    />
                  )}
                </Box>
              </Box>
            )}

            {/* Property Images */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Property Images
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<AddIcon />}
              sx={{ mb: 2 }}
            >
              Add Property Images (Max 10 total, 5MB each)
              <input
                type="file"
                hidden
                accept="image/*"
                multiple
                onChange={handlePropertyImagesUpload}
              />
            </Button>

            {propertyImages.length > 0 && (
              <ImageList sx={{ width: '100%', maxHeight: 450 }} cols={3} rowHeight={164}>
                {propertyImages.map((image, index) => (
                  <ImageListItem key={index}>
                    <img
                      src={image}
                      alt={`Property image ${index + 1}`}
                      loading="lazy"
                      style={{ height: '164px', objectFit: 'cover' }}
                    />
                    <ImageListItemBar
                      actionIcon={
                        <IconButton
                          sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                          onClick={() => removePropertyImage(index)}
                          aria-label={`Delete image ${index + 1}`}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            )}

            {/* Submit Button */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/my-listings')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>

      {/* Snackbar for messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

export default EditListingPage;
