import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  Textarea,
  VStack,
  HStack,
  useToast,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip,
  Divider,
  Flex,
  Spacer,
  IconButton,
  List,
  ListItem,
  ListIcon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import {
  CheckCircleIcon,
  WarningIcon,
  CalendarIcon,
  TimeIcon,
  InfoIcon,
  DownloadIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@chakra-ui/icons';
import ProgressChart from './ProgressChart';

const WBSGenerator = ({ projectId }) => {
  const [parsedData, setParsedData] = useState([]);
  const [ctrDataId, setCtrDataId] = useState('');
  const [mdrDataId, setMdrDataId] = useState('');
  const [wbsName, setWbsName] = useState('');
  const [wbsDescription, setWbsDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [error, setError] = useState(null);
  const [generatedWbs, setGeneratedWbs] = useState(null);
  const [wbsData, setWbsData] = useState(null);
  const [expandedElements, setExpandedElements] = useState({});
  const [chartType, setChartType] = useState('bar');
  
  const toast = useToast();
  
  // Fetch parsed data when component mounts or projectId changes
  useEffect(() => {
    if (projectId) {
      fetchParsedData();
    }
  }, [projectId]);
  
  // Fetch parsed data from the server
  const fetchParsedData = async () => {
    if (!projectId) {
      setError('Project ID is required.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/pmfusion/project/${projectId}/parsed-data`);
      setParsedData(response.data);
      
      // Reset selections
      setCtrDataId('');
      setMdrDataId('');
      
    } catch (err) {
      console.error('Error fetching parsed data:', err);
      setError(
        err.response?.data?.detail || 
        'An error occurred while fetching parsed data. Please try again.'
      );
      
      toast({
        title: 'Failed to load data.',
        description: err.response?.data?.detail || 'Failed to fetch parsed data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle CTR data selection
  const handleCtrDataChange = (e) => {
    setCtrDataId(e.target.value);
  };
  
  // Handle MDR data selection
  const handleMdrDataChange = (e) => {
    setMdrDataId(e.target.value);
  };
  
  // Handle WBS name change
  const handleWbsNameChange = (e) => {
    setWbsName(e.target.value);
  };
  
  // Handle WBS description change
  const handleWbsDescriptionChange = (e) => {
    setWbsDescription(e.target.value);
  };

  // Handle chart type change
  const handleChartTypeChange = (e) => {
    setChartType(e.target.value);
  };
  
  // Generate WBS
  const generateWbs = async () => {
    if (!projectId) {
      setError('Project ID is required.');
      return;
    }
    
    if (!ctrDataId) {
      setError('CTR data is required.');
      return;
    }
    
    if (!wbsName) {
      setError('WBS name is required.');
      return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(0);
    setError(null);
    setGeneratedWbs(null);
    setWbsData(null);
    
    try {
      // Simulate generation progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 200);
      
      const requestData = {
        ctr_data_id: ctrDataId,
        project_id: projectId,
        name: wbsName,
        description: wbsDescription || undefined,
        options: {}
      };
      
      // Add MDR data if selected
      if (mdrDataId) {
        requestData.mdr_data_id = mdrDataId;
      }
      
      const response = await axios.post('/api/pmfusion/generate/wbs', requestData);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      setGeneratedWbs(response.data);
      
      toast({
        title: 'WBS generated successfully.',
        description: `Work Breakdown Structure "${wbsName}" has been generated.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Fetch the generated WBS data
      fetchWbsData(response.data.wbs_id);
      
    } catch (err) {
      console.error('Error generating WBS:', err);
      setError(
        err.response?.data?.detail || 
        'An error occurred while generating the WBS. Please try again.'
      );
      
      toast({
        title: 'Generation failed.',
        description: err.response?.data?.detail || 'Failed to generate WBS.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Fetch WBS data
  const fetchWbsData = async (wbsId) => {
    try {
      const response = await axios.get(`/api/pmfusion/data/wbs/${wbsId}`);
      setWbsData(response.data);
      
      // Initialize expanded state for root elements
      const initialExpandedState = {};
      response.data.root_element_ids.forEach(id => {
        initialExpandedState[id] = true;
      });
      setExpandedElements(initialExpandedState);
      
    } catch (err) {
      console.error('Error fetching WBS data:', err);
      setError(
        err.response?.data?.detail || 
        'An error occurred while fetching WBS data. Please try again.'
      );
      
      toast({
        title: 'Failed to load WBS data.',
        description: err.response?.data?.detail || 'Failed to fetch WBS data.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Toggle element expansion
  const toggleElementExpansion = (elementId) => {
    setExpandedElements(prev => ({
      ...prev,
      [elementId]: !prev[elementId]
    }));
  };
  
  // Reset the form
  const resetForm = () => {
    setCtrDataId('');
    setMdrDataId('');
    setWbsName('');
    setWbsDescription('');
    setError(null);
    setGeneratedWbs(null);
    setWbsData(null);
    setExpandedElements({});
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Get element by ID
  const getElementById = (elementId) => {
    if (!wbsData || !wbsData.elements) return null;
    return wbsData.elements.find(element => element.id === elementId);
  };
  
  // Render WBS element
  const renderWbsElement = (elementId, level = 0) => {
    const element = getElementById(elementId);
    if (!element) return null;
    
    const isExpanded = expandedElements[elementId];
    const hasChildren = element.children_ids && element.children_ids.length > 0;
    const indentation = level * 20; // 20px indentation per level
    
    return (
      <Box key={elementId} mb={2}>
        <Flex 
          p={2} 
          bg={level % 2 === 0 ? 'gray.50' : 'white'} 
          borderRadius="md"
          borderLeft="4px solid"
          borderLeftColor={getProgressColor(element.progress)}
          _hover={{ bg: 'gray.100' }}
        >
          <Box ml={`${indentation}px`} width="100%">
            <Flex align="center">
              {hasChildren && (
                <IconButton
                  icon={isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleElementExpansion(elementId)}
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                  mr={2}
                />
              )}
              {!hasChildren && <Box ml={8} />}
              
              <Text fontWeight="bold">
                {element.code} - {element.name}
              </Text>
              
              <Spacer />
              
              <Tooltip label={`Progress: ${element.progress.toFixed(1)}%`}>
                <Badge 
                  colorScheme={getProgressColorScheme(element.progress)}
                  variant="subtle"
                  px={2}
                  py={1}
                  borderRadius="full"
                >
                  {element.progress.toFixed(1)}%
                </Badge>
              </Tooltip>
              
              <Tooltip label={`Approved Hours: ${element.approved_hours}`}>
                <Badge 
                  colorScheme="blue" 
                  variant="outline"
                  ml={2}
                  px={2}
                  py={1}
                >
                  {element.approved_hours} hrs
                </Badge>
              </Tooltip>
              
              {element.discipline && (
                <Tooltip label={`Discipline: ${element.discipline}`}>
                  <Badge 
                    colorScheme="purple" 
                    variant="subtle"
                    ml={2}
                    px={2}
                    py={1}
                  >
                    {element.discipline}
                  </Badge>
                </Tooltip>
              )}
            </Flex>
            
            {isExpanded && (
              <Box mt={2} ml={8}>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={2}>
                  <Box>
                    <Text fontSize="sm" fontWeight="bold">Planned Dates:</Text>
                    <Text fontSize="sm">
                      {formatDate(element.planned_start_date)} - {formatDate(element.planned_end_date)}
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" fontWeight="bold">Actual Dates:</Text>
                    <Text fontSize="sm">
                      {formatDate(element.actual_start_date)} - {formatDate(element.actual_end_date)}
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" fontWeight="bold">Hours:</Text>
                    <Text fontSize="sm">
                      Approved: {element.approved_hours} / Actual: {element.actual_hours || 0}
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" fontWeight="bold">Tasks/Documents:</Text>
                    <Text fontSize="sm">
                      Tasks: {element.task_ids.length} / Docs: {element.document_ids.length}
                    </Text>
                  </Box>
                </SimpleGrid>
              </Box>
            )}
          </Box>
        </Flex>
        
        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <Box>
            {element.children_ids.map(childId => renderWbsElement(childId, level + 1))}
          </Box>
        )}
      </Box>
    );
  };
  
  // Get color based on progress
  const getProgressColor = (progress) => {
    if (progress >= 100) return 'green.500';
    if (progress >= 75) return 'green.400';
    if (progress >= 50) return 'yellow.400';
    if (progress >= 25) return 'orange.400';
    return 'red.400';
  };
  
  // Get color scheme based on progress
  const getProgressColorScheme = (progress) => {
    if (progress >= 100) return 'green';
    if (progress >= 75) return 'green';
    if (progress >= 50) return 'yellow';
    if (progress >= 25) return 'orange';
    return 'red';
  };

  // Prepare chart data from WBS elements
  const prepareChartData = () => {
    if (!wbsData || !wbsData.elements) return [];
    
    // Get top-level elements for the chart
    const topLevelElements = wbsData.elements
      .filter(element => wbsData.root_element_ids.includes(element.id))
      .map(element => ({
        name: element.name,
        code: element.code,
        progress: element.progress,
        approved_hours: element.approved_hours
      }));
    
    return topLevelElements;
  };
  
  // Render WBS summary stats
  const renderWbsSummary = () => {
    if (!generatedWbs || !generatedWbs.summary) return null;
    
    const { summary } = generatedWbs;
    
    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={4}>
        <Stat>
          <StatLabel>Total Elements</StatLabel>
          <StatNumber>{summary.total_elements}</StatNumber>
          <StatHelpText>{summary.max_level} levels deep</StatHelpText>
        </Stat>
        
        <Stat>
          <StatLabel>Tasks</StatLabel>
          <StatNumber>{summary.total_tasks}</StatNumber>
          <StatHelpText>From CTR data</StatHelpText>
        </Stat>
        
        <Stat>
          <StatLabel>Documents</StatLabel>
          <StatNumber>{summary.total_documents}</StatNumber>
          <StatHelpText>From MDR data</StatHelpText>
        </Stat>
        
        <Stat>
          <StatLabel>Overall Progress</StatLabel>
          <StatNumber>{summary.overall_progress.toFixed(1)}%</StatNumber>
          <StatHelpText>
            {summary.total_actual_hours} / {summary.total_approved_hours} hours
          </StatHelpText>
        </Stat>
      </SimpleGrid>
    );
  };
  
  return (
    <Card variant="outline" width="100%" mb={4}>
      <CardHeader>
        <Heading size="md">Work Breakdown Structure Generator</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {/* WBS Configuration Form */}
          <Box>
            <Heading size="sm" mb={4}>WBS Configuration</Heading>
            
            {/* CTR Data Selection */}
            <FormControl isRequired mb={4}>
              <FormLabel>CTR Data</FormLabel>
              <Select 
                value={ctrDataId} 
                onChange={handleCtrDataChange}
                placeholder="Select CTR data"
                isDisabled={isLoading || isGenerating}
              >
                {parsedData
                  .filter(data => data.data_type === 'CTR')
                  .map(data => (
                    <option key={data.id} value={data.id}>
                      {data.summary.tasks} tasks, {data.summary.resources} resources
                    </option>
                  ))}
              </Select>
            </FormControl>
            
            {/* MDR Data Selection */}
            <FormControl mb={4}>
              <FormLabel>MDR Data (Optional)</FormLabel>
              <Select 
                value={mdrDataId} 
                onChange={handleMdrDataChange}
                placeholder="Select MDR data (optional)"
                isDisabled={isLoading || isGenerating}
              >
                {parsedData
                  .filter(data => data.data_type === 'MDR')
                  .map(data => (
                    <option key={data.id} value={data.id}>
                      {data.summary.documents} documents
                    </option>
                  ))}
              </Select>
            </FormControl>
            
            {/* WBS Name */}
            <FormControl isRequired mb={4}>
              <FormLabel>WBS Name</FormLabel>
              <Input
                value={wbsName}
                onChange={handleWbsNameChange}
                placeholder="Enter WBS name"
                isDisabled={isLoading || isGenerating}
              />
            </FormControl>
            
            {/* WBS Description */}
            <FormControl mb={4}>
              <FormLabel>Description (Optional)</FormLabel>
              <Textarea
                value={wbsDescription}
                onChange={handleWbsDescriptionChange}
                placeholder="Enter a description for this WBS"
                isDisabled={isLoading || isGenerating}
              />
            </FormControl>
            
            {/* Error Display */}
            {error && (
              <Alert status="error" borderRadius="md" mb={4}>
                <AlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Generation Progress */}
            {isGenerating && (
              <Box mb={4}>
                <Text mb={2}>Generating WBS: {generationProgress}%</Text>
                <Progress value={generationProgress} size="sm" colorScheme="blue" borderRadius="md" />
              </Box>
            )}
            
            {/* Action Buttons */}
            <HStack spacing={4} justify="flex-end">
              <Button 
                onClick={resetForm} 
                isDisabled={isLoading || isGenerating}
                variant="outline"
              >
                Reset
              </Button>
              <Button
                colorScheme="blue"
                onClick={generateWbs}
                isLoading={isGenerating}
                loadingText="Generating..."
                isDisabled={!ctrDataId || !wbsName || isLoading || isGenerating}
              >
                Generate WBS
              </Button>
            </HStack>
          </Box>
          
          {/* WBS Display */}
          {generatedWbs && wbsData && (
            <Box mt={6}>
              <Divider mb={6} />
              
              <Heading size="md" mb={4}>
                {wbsData.name}
                {wbsData.description && (
                  <Text fontSize="sm" fontWeight="normal" mt={1} color="gray.600">
                    {wbsData.description}
                  </Text>
                )}
              </Heading>
              
              {/* WBS Summary */}
              {renderWbsSummary()}
              
              {/* Progress Chart */}
              <Box mb={6}>
                <HStack mb={2} justify="space-between">
                  <Heading size="sm">Progress Visualization</Heading>
                  <Select 
                    value={chartType}
                    onChange={handleChartTypeChange}
                    width="150px"
                    size="sm"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="radial">Radial Chart</option>
                  </Select>
                </HStack>
                <ProgressChart 
                  data={prepareChartData()}
                  title="WBS Element Progress"
                  showLabels={true}
                  type={chartType}
                />
              </Box>
              
              {/* WBS Tree View */}
              <Box 
                border="1px solid" 
                borderColor="gray.200" 
                borderRadius="md" 
                p={4}
                maxHeight="600px"
                overflowY="auto"
              >
                <Heading size="sm" mb={4}>Work Breakdown Structure</Heading>
                
                {wbsData.root_element_ids.map(rootId => renderWbsElement(rootId))}
                
                {wbsData.root_element_ids.length === 0 && (
                  <Text>No WBS elements found.</Text>
                )}
              </Box>
            </Box>
          )}
          
          {/* Loading State */}
          {isLoading && (
            <Flex justify="center" align="center" p={8}>
              <Spinner size="xl" color="blue.500" />
              <Text ml={4}>Loading data...</Text>
            </Flex>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default WBSGenerator;
