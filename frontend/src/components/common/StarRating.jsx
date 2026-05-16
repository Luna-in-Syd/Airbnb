import { Box } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import StarOutlineIcon from '@mui/icons-material/StarOutline';

/**
 * StarRating component displays a 5-star rating visualization
 * @param {number} rating - Rating value (0-5)
 * @param {string} size - Size of stars: 'small', 'medium', 'large' (default: 'small')
 * @param {string} color - Color of filled stars (default: '#FFD700' - gold)
 */
const StarRating = ({ rating = 0, size = 'small', color = '#FFD700' }) => {
  const numericRating = parseFloat(rating) || 0;
  const fullStars = Math.floor(numericRating);
  const hasHalfStar = numericRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const stars = [];

  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <StarIcon
        key={`full-${i}`}
        fontSize={size}
        sx={{ color }}
      />
    );
  }

  // Add half star if applicable
  if (hasHalfStar) {
    stars.push(
      <StarHalfIcon
        key="half"
        fontSize={size}
        sx={{ color }}
      />
    );
  }

  // Add empty stars
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <StarOutlineIcon
        key={`empty-${i}`}
        fontSize={size}
        sx={{ color: '#E0E0E0' }}
      />
    );
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.25,
      }}
      role="img"
      aria-label={`Rating: ${numericRating.toFixed(1)} out of 5 stars`}
    >
      {stars}
    </Box>
  );
};

export default StarRating;
