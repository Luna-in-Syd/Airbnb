import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InfoIcon from '@mui/icons-material/Info';
import ImageIcon from '@mui/icons-material/Image';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { createListing } from '../services/listingsService';

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

const CreateListingPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    street: '',
    city: '',
    state: '',
    postcode: '',
    country: '',
    price: '',
    thumbnail: '',
    youtubeUrl: '',
    thumbnailType: 'image',
    propertyType: '',
    bathrooms: '',
  });

  const [bedrooms, setBedrooms] = useState([
    { type: 'Master Bedroom', beds: 1 },
  ]);

  const [amenities, setAmenities] = useState([]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Handle JSON import
  const handleJsonImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setSnackbar({
        open: true,
        message: 'Please upload a valid JSON file',
        severity: 'error',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);

        console.log('Imported JSON data:', jsonData);

        // Map JSON to form fields (supports flat and nested structure)
        setFormData({
          title: jsonData.title || '',
          street: jsonData.address?.street || jsonData.street || '',
          city: jsonData.address?.city || jsonData.city || '',
          state: jsonData.address?.state || jsonData.state || '',
          postcode: jsonData.address?.postcode || jsonData.postcode || '',
          country: jsonData.address?.country || jsonData.country || '',
          price: jsonData.price || '',
          thumbnail: jsonData.thumbnail || '',
          propertyType: jsonData.metadata?.propertyType || jsonData.propertyType || '',
          bathrooms: jsonData.metadata?.bathrooms || jsonData.bathrooms || '',
        });

        // Set bedrooms
        if (jsonData.metadata?.bedrooms || jsonData.bedrooms) {
          const bedroomsData = jsonData.metadata?.bedrooms || jsonData.bedrooms;
          if (Array.isArray(bedroomsData)) {
            setBedrooms(
              bedroomsData.map((bedroom) => ({
                type: bedroom.type || 'Master Bedroom',
                beds: parseInt(bedroom.beds) || 1,
              }))
            );
          } else if (typeof bedroomsData === 'number') {
            const defaultBedrooms = [];
            for (let i = 0; i < bedroomsData; i++) {
              defaultBedrooms.push({ type: 'Master Bedroom', beds: 1 });
            }
            setBedrooms(defaultBedrooms);
          }
        }

        // Set amenities
        if (jsonData.metadata?.amenities || jsonData.amenities) {
          const amenitiesData = jsonData.metadata?.amenities || jsonData.amenities;
          if (Array.isArray(amenitiesData)) {
            setAmenities(amenitiesData.filter((a) => COMMON_AMENITIES.includes(a)));
          }
        }

        setSnackbar({
          open: true,
          message: 'Property information imported successfully',
          severity: 'success',
        });

        event.target.value = '';
      } catch (error) {
        console.error('Error parsing JSON:', error);
        setSnackbar({
          open: true,
          message: 'Invalid JSON format. Please check the file.',
          severity: 'error',
        });
      }
    };

    reader.onerror = () => {
      setSnackbar({
        open: true,
        message: 'Error reading file',
        severity: 'error',
      });
    };

    reader.readAsText(file);
  };

  // Handle basic field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleBedroomChange = (index, field, value) => {
    const newBedrooms = [...bedrooms];
    newBedrooms[index][field] = field === 'beds' ? Number(value) : value;
    setBedrooms(newBedrooms);

    if (errors.bedrooms) {
      setErrors((prev) => ({
        ...prev,
        bedrooms: '',
      }));
    }
  };

  const handleAddBedroom = () => {
    setBedrooms((prev) => [...prev, { type: 'Master Bedroom', beds: 1 }]);
  };

  const handleRemoveBedroom = (index) => {
    setBedrooms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAmenityToggle = (amenity) => {
    setAmenities((prev) => {
      if (prev.includes(amenity)) {
        return prev.filter((a) => a !== amenity);
      } else {
        return [...prev, amenity];
      }
    });
  };

  // Handle image upload
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, thumbnail: 'Image must be less than 5MB' }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, thumbnail: 'Please upload a valid image file' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        thumbnail: reader.result,
        thumbnailType: 'image',
      }));
      setErrors((prev) => ({ ...prev, thumbnail: '' }));
    };
    reader.readAsDataURL(file);
  };

  // Handle YouTube URL input
  const handleYoutubeUrlChange = (e) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, youtubeUrl: url }));

    const youtubeId = extractYoutubeId(url);
    if (url && youtubeId) {
      setFormData((prev) => ({
        ...prev,
        thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
        thumbnailType: 'youtube',
      }));
      setErrors((prev) => ({ ...prev, thumbnail: '' }));
    } else if (url) {
      setErrors((prev) => ({ ...prev, thumbnail: 'Please enter a valid YouTube URL' }));
    }
  };

  // Extract YouTube ID
  const extractYoutubeId = (url) => {
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  // Switch thumbnail type
  const handleThumbnailTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      thumbnailType: type,
      thumbnail: type === 'image' ? '' : prev.thumbnail,
      youtubeUrl: type === 'youtube' ? prev.youtubeUrl : '',
    }));
    setErrors((prev) => ({ ...prev, thumbnail: '' }));
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.propertyType) newErrors.propertyType = 'Property type is required';
    if (!formData.price || Number(formData.price) <= 0)
      newErrors.price = 'Price must be greater than 0';

    if (!formData.street.trim()) newErrors.street = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';

    if (!formData.bathrooms || Number(formData.bathrooms) <= 0)
      newErrors.bathrooms = 'Bathrooms must be greater than 0';

    // Validate thumbnail by type
    if (formData.thumbnailType === 'image' && !formData.thumbnail) {
      newErrors.thumbnail = 'Please upload a thumbnail image';
    } else if (formData.thumbnailType === 'youtube') {
      if (!formData.youtubeUrl) newErrors.thumbnail = 'Please enter a YouTube URL';
      else if (!extractYoutubeId(formData.youtubeUrl))
        newErrors.thumbnail = 'Please enter a valid YouTube URL';
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fill all required fields correctly',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const listingData = {
        title: formData.title,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postcode: formData.postcode,
          country: formData.country,
        },
        price: Number(formData.price),
        thumbnail: formData.thumbnail,
        metadata: {
          propertyType: formData.propertyType,
          bathrooms: Number(formData.bathrooms),
          bedrooms: bedrooms,
          amenities: amenities,
          thumbnailType: formData.thumbnailType,
          youtubeUrl: formData.thumbnailType === 'youtube' ? formData.youtubeUrl : undefined,
          youtubeId:
            formData.thumbnailType === 'youtube'
              ? extractYoutubeId(formData.youtubeUrl)
              : undefined,
        },
      };

      console.log('Creating listing with data:', listingData);
      await createListing(listingData);

      setSnackbar({
        open: true,
        message: 'Listing created successfully',
        severity: 'success',
      });

      setTimeout(() => {
        navigate('/my-listings');
      }, 1500);
    } catch (error) {
      console.error('Error creating listing:', error);
      setSnackbar({
                open: true,
        message: error.message || 'Failed to create listing',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          {/* Header with JSON import */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                onClick={() => navigate('/my-listings')}
                sx={{ mr: 2 }}
                aria-label="Go back to listings"
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" component="h1">
                Create New Listing
              </Typography>
            </Box>

            {/* JSON import */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleJsonImport}
                accept=".json,application/json"
                style={{ display: 'none' }}
                id="json-file-input"
              />
              <Button
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'rgba(25, 118, 210, 0.04)',
                  },
                }}
              >
                Import JSON
              </Button>
              <Tooltip
                title="Import property details from a JSON file. The file should contain title, address, price, bedrooms, amenities, etc."
                arrow
              >
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <form onSubmit={handleSubmit}>
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
            </Grid>
            <Grid container spacing={2}>
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
              inputProps={{ min: 1, step: 0.5 }}
            />
            {/* Bedrooms */}
            <Box sx={{ mt: 3, mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1" fontWeight="medium">
                  Bedrooms *
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddBedroom}
                  size="small"
                  variant="outlined"
                >
                  Add Bedroom
                </Button>
              </Box>
              {errors.bedrooms && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errors.bedrooms}
                </Alert>
              )}

              {bedrooms.map((bedroom, index) => (
                <Paper key={index} elevation={1} sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                      <Typography variant="subtitle2" gutterBottom>
                        Bedroom {index + 1}
                      </Typography>
                      <FormControl fullWidth size="small">
                        <InputLabel>Bedroom Type</InputLabel>
                        <Select
                          value={bedroom.type}
                          onChange={(e) =>
                            handleBedroomChange(index, 'type', e.target.value)
                          }
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
                    <Grid item xs={12} sm={5}>
                      <Typography variant="subtitle2" gutterBottom>
                        Number of Beds
                      </Typography>
                      <TextField
                        fullWidth
                        type="number"
                        value={bedroom.beds}
                        onChange={(e) =>
                          handleBedroomChange(index, 'beds', e.target.value)
                        }
                        size="small"
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      {bedrooms.length > 1 && (
                        <IconButton
                          onClick={() => handleRemoveBedroom(index)}
                          color="error"
                          aria-label="Remove bedroom"
                        >
                          <RemoveIcon />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Amenities
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <FormGroup>
              <Grid container spacing={2}>
                {COMMON_AMENITIES.map((amenity) => (
                  <Grid item xs={6} sm={4} md={3} key={amenity}>
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

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Thumbnail
            </Typography>
            <Divider sx={{ mb: 2 }} />

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

            {formData.thumbnailType === 'image' && (
              <>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ mb: 2 }}
                  startIcon={<UploadFileIcon />}
                >
                  Upload Thumbnail Image (Max 5MB)
                  <input type="file" hidden accept="image/*" onChange={handleThumbnailUpload} />
                </Button>
              </>
            )}

            {formData.thumbnailType === 'youtube' && (
              <>
                <TextField
                  fullWidth
                  label="YouTube URL"
                  name="youtubeUrl"
                  value={formData.youtubeUrl}
                  onChange={handleYoutubeUrlChange}
                  placeholder="https://www.youtube.com/watch?v=..."
                  margin="normal"
                  helperText="Enter a valid YouTube video URL"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <YouTubeIcon color="error" />
                      </InputAdornment>
                    ),
                  }}
                />
              </>
            )}

            {errors.thumbnail && (
              <Alert severity="error" sx={{ mb: 2, mt: 2 }}>
                {errors.thumbnail}
              </Alert>
            )}
{formData.thumbnail && (
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Thumbnail Preview:
                </Typography>
                <Box sx={{ textAlign: 'center' }}>
                  {formData.thumbnailType === 'youtube' && formData.youtubeUrl ? (
                    <Box>
                      <Box
                        sx={{
                          position: 'relative',
                          paddingBottom: '56.25%',
                          height: 0,
                          overflow: 'hidden',
                          maxWidth: '100%',
                          background: '#000',
                          borderRadius: '8px',
                          mb: 2,
                        }}
                      >
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYoutubeId(
                            formData.youtubeUrl
                          )}`}
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

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
              <Button variant="outlined" onClick={() => navigate('/my-listings')} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Creating...' : 'Create Listing'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CreateListingPage;
