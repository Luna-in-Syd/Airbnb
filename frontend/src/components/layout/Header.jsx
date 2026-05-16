import { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Snackbar, Alert, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { logout as logoutApi } from '../../services/authService';
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userEmail, logout } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userName, setUserName] = useState('');

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load avatar and username from localStorage
  useEffect(() => {
    const loadUserData = () => {
      if (userEmail) {
        const storedAvatar = localStorage.getItem(`userAvatar_${userEmail}`);
        const storedName = localStorage.getItem(`userName_${userEmail}`);
        
        if (storedAvatar) {
          setAvatarUrl(storedAvatar);
        } else {
          setAvatarUrl(''); // Clear avatar if not found
        }
        if (storedName) {
          setUserName(storedName);
        } else {
          setUserName(''); // Clear name if not found
        }
      }
    };

    loadUserData();

    // Listen for avatar updates
    const handleAvatarUpdate = () => {
      loadUserData();
    };

    window.addEventListener('avatarUpdate', handleAvatarUpdate);

    return () => {
      window.removeEventListener('avatarUpdate', handleAvatarUpdate);
    };
  }, [userEmail]);

  const handleLogout = async () => {
    try {
      // Call logout API using authService
      await logoutApi();

      // Clear auth state
      logout();

      // Show success message
      setSnackbar({
        open: true,
        message: 'Logged out successfully',
        severity: 'success',
      });

      // Navigate to home page
      navigate('/');
    } catch (_error) {
      // Even if API fails, still logout locally
      logout();
      navigate('/');

      setSnackbar({
        open: true,
        message: 'Logged out (API error occurred)',
        severity: 'warning',
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }));
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => navigate('/')}
          >
            AirBrB
          </Typography>

          {isAuthenticated ? (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                color="inherit"
                startIcon={<HomeIcon />}
                onClick={() => navigate('/')}
                aria-label="View all listings"
              >
                All Listings
              </Button>
              <Button
                color="inherit"
                startIcon={<ListAltIcon />}
                onClick={() => navigate('/my-listings')}
                aria-label="View my hosted listings"
              >
                My Listings
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/account')}
                aria-label="View account details"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Avatar
                  src={avatarUrl}
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'white',
                    color: 'primary.main',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                  }}
                >
                  {!avatarUrl && (userName ? userName.charAt(0).toUpperCase() : (userEmail ? userEmail.charAt(0).toUpperCase() : 'U'))}
                </Avatar>
                <span>Account</span>
              </Button>
              <Button
                color="inherit"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                aria-label="Logout"
              >
                Logout
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                startIcon={<LoginIcon />}
                onClick={() => navigate('/login')}
                aria-label="Login"
              >
                Login
              </Button>
              <Button
                color="inherit"
                startIcon={<PersonAddIcon />}
                onClick={() => navigate('/register')}
                aria-label="Register"
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Snackbar for logout messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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

export default Header;