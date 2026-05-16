import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getAllBookings } from '../../services/bookingsService';

const ProfitChart = ({ listings }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProfit, setTotalProfit] = useState(0);

  useEffect(() => {
    calculateProfitData();
  }, [listings]);

  // General date extraction function - supports multiple dateRange formats
  const extractStartDate = (dateRange) => {
    if (!dateRange) return null;

    // Your backend format: { start_day: "...", end_day: "..." }
    if (dateRange.start_day) return dateRange.start_day;

    // Other common formats:
    if (dateRange.start) return dateRange.start;
    if (dateRange.startDate) return dateRange.startDate;
    if (Array.isArray(dateRange) && dateRange.length >= 2) return dateRange[0];
    if (dateRange.from) return dateRange.from;
    if (dateRange.checkIn) return dateRange.checkIn;

    return null;
  };

  const calculateProfitData = async () => {
    setLoading(true);
    try {
      // Fetch all bookings
      const bookingsResponse = await getAllBookings();
      const allBookings = bookingsResponse.bookings || [];

      console.log('Total bookings fetched:', allBookings.length);
      console.log('My listing IDs:', listings.map(l => l.id));

      // Get all listing IDs for the user
      const myListingIds = listings.map(l => String(l.id));

      // Filter accepted bookings belonging to the user's listings
      const myAcceptedBookings = allBookings.filter(
        booking => {
          const bookingListingId = String(booking.listingId);
          const isMyListing = myListingIds.includes(bookingListingId);
          const isAccepted = booking.status === 'accepted';
          console.log(`Booking ${booking.id}: listingId=${bookingListingId}, isMyListing=${isMyListing}, status=${booking.status}, isAccepted=${isAccepted}`);
          return isMyListing && isAccepted;
        }
      );

      console.log('My accepted bookings:', myAcceptedBookings.length);

      // Create data structure for the past 30 days
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset to start of day
      const profitByDay = {};

      // Initialize past 30 days
      for (let i = 0; i <= 30; i++) {
        profitByDay[i] = 0;
      }

      // Calculate profit for each booking and assign it to the correct day
      myAcceptedBookings.forEach(booking => {
        const totalBookingProfit = booking.totalPrice || 0;
        const dateRange = booking.dateRange;

        console.log(`\nProcessing booking ${booking.id}:`, {
          totalPrice: totalBookingProfit,
          dateRange: dateRange,
          dateRangeKeys: dateRange ? Object.keys(dateRange) : 'null',
        });

        // Use general extraction function
        const startDateValue = extractStartDate(dateRange);

        console.log(`  Extracted start date value:`, startDateValue);

        if (startDateValue) {
          const startDate = new Date(startDateValue);

          // Validate date
          if (isNaN(startDate.getTime())) {
            console.error(`  Invalid date: ${startDateValue}`);
            return;
          }

          startDate.setHours(0, 0, 0, 0);

          // Calculate how many days ago the booking start date was
          const daysFromToday = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

          console.log(`  Start date: ${startDate.toISOString()}, Days from today: ${daysFromToday}`);

          // Add profit if within past 30 days
          if (daysFromToday >= 0 && daysFromToday <= 30) {
            profitByDay[daysFromToday] += totalBookingProfit;
            console.log(`   Added $${totalBookingProfit} to day ${daysFromToday}`);
          } else if (daysFromToday < 0) {
            console.log(`   Booking is in the FUTURE: ${Math.abs(daysFromToday)} days from now (${startDate.toLocaleDateString()})`);
          } else {
            console.log(`   Booking is too OLD: ${daysFromToday} days ago (outside 30-day window)`);
          }
        } else {
          console.error(`   Could not extract start date from dateRange:`, dateRange);
        }
      });

      // Convert to chart format
      const chartDataArray = [];
      let cumulativeProfit = 0;

      for (let i = 30; i >= 0; i--) {
        cumulativeProfit += profitByDay[i];
        chartDataArray.push({
          daysAgo: i,
          profit: profitByDay[i],
          label: i === 0 ? 'Today' : `${i} days ago`,
        });
      }

      console.log('Final Results:');
      console.log('Chart data points:', chartDataArray.length);
      console.log('Days with profit:', Object.entries(profitByDay).filter(([_, p]) => p > 0).length);
      console.log('Total profit:', cumulativeProfit);

      setChartData(chartDataArray.reverse());
      setTotalProfit(cumulativeProfit);
    } catch (error) {
      console.error('Failed to calculate profit data:', error);
      // If error, show empty data
      const emptyData = [];
      for (let i = 30; i >= 0; i--) {
        emptyData.push({
          daysAgo: i,
          profit: 0,
          label: i === 0 ? 'Today' : `${i} days ago`,
        });
      }
      setChartData(emptyData.reverse());
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 4 }}>
      <CardContent>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="h2">
            Profit Statistics (Past 30 Days)
          </Typography>
          <Typography variant="h5" color="primary" fontWeight="bold">
            Total: ${totalProfit.toFixed(2)}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Displays the daily profit of all your listings over the past month.
        </Typography>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="daysAgo"
              label={{ value: 'Days Ago', position: 'insideBottom', offset: -5 }}
              reversed
            />
            <YAxis
              label={{ value: 'Profit ($)', angle: -90, position: 'insideLeft' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              formatter={(value) => [`$${value.toFixed(2)}`, 'Profit']}
              labelFormatter={(label) => {
                return label === 0 ? 'Today' : `${label} days ago`;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="profit"
              stroke="#1976d2"
              strokeWidth={2}
              name="Daily Profit"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Note:</strong> The chart shows income from accepted bookings within the past 30 days.
            The X-axis represents the number of days ago (0 = today, 30 = 30 days ago), and the Y-axis shows the total profit for that day.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

ProfitChart.propTypes = {
  listings: PropTypes.array.isRequired,
};

export default ProfitChart;
