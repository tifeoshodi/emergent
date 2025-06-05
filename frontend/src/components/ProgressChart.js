import React from 'react';
import {
  Box,
  Flex,
  Text,
  Tooltip,
  VStack,
  HStack,
  Badge,
  Heading,
  useColorModeValue,
} from '@chakra-ui/react';

/**
 * ProgressChart component to visualize WBS progress
 * 
 * @param {Object} props
 * @param {Array} props.data - Array of WBS elements with progress data
 * @param {string} props.title - Chart title
 * @param {boolean} props.showLabels - Whether to show labels on bars
 * @param {string} props.type - Chart type ('bar' or 'radial')
 */
const ProgressChart = ({ 
  data = [], 
  title = 'WBS Progress', 
  showLabels = true,
  type = 'bar'
}) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Get progress color based on percentage
  const getProgressColor = (progress) => {
    if (progress >= 100) return 'green.500';
    if (progress >= 75) return 'green.400';
    if (progress >= 50) return 'yellow.400';
    if (progress >= 25) return 'orange.400';
    return 'red.400';
  };

  // Render bar chart
  const renderBarChart = () => {
    return (
      <VStack spacing={3} align="stretch" width="100%">
        {data.map((item, index) => (
          <Box key={index}>
            <Flex justify="space-between" mb={1}>
              <Text fontSize="sm" fontWeight="medium" isTruncated maxW="70%">
                {item.code ? `${item.code} - ` : ''}{item.name}
              </Text>
              <Badge colorScheme={progress >= 100 ? 'green' : 'blue'}>
                {item.progress.toFixed(1)}%
              </Badge>
            </Flex>
            <Tooltip label={`${item.progress.toFixed(1)}% complete`}>
              <Box
                w="100%"
                bg="gray.100"
                borderRadius="full"
                overflow="hidden"
              >
                <Box
                  w={`${item.progress}%`}
                  h="8px"
                  bg={getProgressColor(item.progress)}
                  borderRadius="full"
                  transition="width 0.5s ease-in-out"
                >
                  {showLabels && item.progress >= 10 && (
                    <Text
                      fontSize="xs"
                      color="white"
                      textAlign="center"
                      fontWeight="bold"
                      lineHeight="8px"
                    >
                      {item.progress.toFixed(0)}%
                    </Text>
                  )}
                </Box>
              </Box>
            </Tooltip>
          </Box>
        ))}
      </VStack>
    );
  };

  // Render radial chart (simple version with circular indicators)
  const renderRadialChart = () => {
    return (
      <Flex flexWrap="wrap" justify="center" gap={4}>
        {data.map((item, index) => {
          const size = 80; // Size of the circle
          const strokeWidth = 6;
          const radius = (size - strokeWidth) / 2;
          const circumference = radius * 2 * Math.PI;
          const strokeDashoffset = circumference - (item.progress / 100) * circumference;
          
          return (
            <Tooltip key={index} label={`${item.name}: ${item.progress.toFixed(1)}%`}>
              <VStack>
                <Box position="relative" width={`${size}px`} height={`${size}px`}>
                  {/* Background circle */}
                  <Box
                    as="svg"
                    width={size}
                    height={size}
                    position="absolute"
                  >
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="transparent"
                      stroke="gray.200"
                      strokeWidth={strokeWidth}
                    />
                  </Box>
                  
                  {/* Progress circle */}
                  <Box
                    as="svg"
                    width={size}
                    height={size}
                    position="absolute"
                    transform="rotate(-90deg)"
                    transformOrigin="center"
                  >
                    <circle
                      cx={size / 2}
                      cy={size / 2}
                      r={radius}
                      fill="transparent"
                      stroke={getProgressColor(item.progress)}
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </Box>
                  
                  {/* Percentage text */}
                  <Flex
                    position="absolute"
                    top="0"
                    left="0"
                    width="100%"
                    height="100%"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="sm" fontWeight="bold">
                      {item.progress.toFixed(0)}%
                    </Text>
                  </Flex>
                </Box>
                <Text fontSize="xs" textAlign="center" maxW="80px" isTruncated>
                  {item.code || item.name}
                </Text>
              </VStack>
            </Tooltip>
          );
        })}
      </Flex>
    );
  };

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="md"
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow="sm"
      width="100%"
    >
      <Heading size="sm" mb={4}>{title}</Heading>
      
      {data.length === 0 ? (
        <Text color="gray.500">No progress data available</Text>
      ) : (
        type === 'bar' ? renderBarChart() : renderRadialChart()
      )}
      
      {data.length > 0 && (
        <HStack mt={4} justify="flex-end" spacing={2}>
          <Text fontSize="xs" color="gray.500">
            Total elements: {data.length}
          </Text>
          {data.length > 0 && (
            <Text fontSize="xs" color="gray.500">
              Average: {(data.reduce((sum, item) => sum + item.progress, 0) / data.length).toFixed(1)}%
            </Text>
          )}
        </HStack>
      )}
    </Box>
  );
};

export default ProgressChart;
