import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Badge,
  Icon,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { AddIcon, CheckIcon, WarningIcon } from '@chakra-ui/icons';
import FileUploader from './FileUploader';
import WBSGenerator from './WBSGenerator';

const PMFusionApp = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  
  const toast = useToast();
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  
  // Load projects from localStorage on component mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('pmfusion_projects');
    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects);
        
        // If there are projects, select the first one by default
        if (parsedProjects.length > 0) {
          setSelectedProject(parsedProjects[0]);
        }
      } catch (error) {
        console.error('Error loading projects from localStorage:', error);
      }
    }
  }, []);
  
  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('pmfusion_projects', JSON.stringify(projects));
    }
  }, [projects]);
  
  // Create a new project
  const createProject = () => {
    if (!newProjectName.trim()) {
      toast({
        title: 'Project name is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    const newProject = {
      id: uuidv4(),
      name: newProjectName,
      description: newProjectDescription,
      createdAt: new Date().toISOString(),
      files: [],
      wbsData: []
    };
    
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    setSelectedProject(newProject);
    
    // Reset form and close modal
    setNewProjectName('');
    setNewProjectDescription('');
    onClose();
    
    toast({
      title: 'Project created',
      description: `Project "${newProjectName}" has been created successfully.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Select a project
  const handleSelectProject = (project) => {
    setSelectedProject(project);
  };
  
  // Handle file upload completion
  const handleFileUploaded = (fileData) => {
    if (!selectedProject) return;
    
    // Add file to the project's files list
    const updatedProject = {
      ...selectedProject,
      files: [...selectedProject.files, fileData]
    };
    
    // Update the project in the projects list
    const updatedProjects = projects.map(project => 
      project.id === selectedProject.id ? updatedProject : project
    );
    
    setProjects(updatedProjects);
    setSelectedProject(updatedProject);
    setUploadedFiles([...uploadedFiles, fileData]);
    
    toast({
      title: 'File processed',
      description: `${fileData.fileType} file has been uploaded and parsed successfully.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Render project selection sidebar
  const renderProjectSidebar = () => {
    return (
      <Card variant="outline" mb={4} bg={cardBg}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Heading size="md">Projects</Heading>
            <Button 
              leftIcon={<AddIcon />} 
              colorScheme="blue" 
              size="sm"
              onClick={onOpen}
            >
              New Project
            </Button>
          </Flex>
        </CardHeader>
        <CardBody>
          <VStack spacing={2} align="stretch">
            {projects.length === 0 ? (
              <Text color="gray.500">No projects yet. Create your first project to get started.</Text>
            ) : (
              projects.map(project => (
                <Button
                  key={project.id}
                  variant={selectedProject?.id === project.id ? "solid" : "ghost"}
                  colorScheme={selectedProject?.id === project.id ? "blue" : "gray"}
                  justifyContent="flex-start"
                  onClick={() => handleSelectProject(project)}
                  py={3}
                  borderRadius="md"
                >
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">{project.name}</Text>
                    <Text fontSize="xs" color="gray.500">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </Text>
                  </VStack>
                </Button>
              ))
            )}
          </VStack>
        </CardBody>
      </Card>
    );
  };
  
  // Render project dashboard
  const renderProjectDashboard = () => {
    if (!selectedProject) {
      return (
        <Card variant="outline" p={8} textAlign="center" bg={cardBg}>
          <VStack spacing={4}>
            <Icon as={WarningIcon} boxSize={12} color="orange.400" />
            <Heading size="md">No Project Selected</Heading>
            <Text>Please select a project from the sidebar or create a new one to get started.</Text>
            <Button colorScheme="blue" onClick={onOpen}>Create New Project</Button>
          </VStack>
        </Card>
      );
    }
    
    return (
      <Card variant="outline" bg={cardBg}>
        <CardHeader>
          <VStack align="start" spacing={1}>
            <Heading size="lg">{selectedProject.name}</Heading>
            {selectedProject.description && (
              <Text color="gray.600">{selectedProject.description}</Text>
            )}
          </VStack>
        </CardHeader>
        <CardBody>
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>Dashboard</Tab>
              <Tab>Upload Files</Tab>
              <Tab>Generate WBS</Tab>
            </TabList>
            
            <TabPanels>
              {/* Dashboard Tab */}
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
                  <Card variant="outline" p={4}>
                    <Heading size="sm" mb={2}>Files</Heading>
                    <HStack>
                      <Badge colorScheme="blue" px={2} py={1} borderRadius="full">
                        {selectedProject.files.filter(f => f.fileType === 'CTR').length} CTR Files
                      </Badge>
                      <Badge colorScheme="green" px={2} py={1} borderRadius="full">
                        {selectedProject.files.filter(f => f.fileType === 'MDR').length} MDR Files
                      </Badge>
                    </HStack>
                  </Card>
                  
                  <Card variant="outline" p={4}>
                    <Heading size="sm" mb={2}>Work Breakdown Structures</Heading>
                    <Badge colorScheme="purple" px={2} py={1} borderRadius="full">
                      {selectedProject.wbsData?.length || 0} WBS Generated
                    </Badge>
                  </Card>
                </SimpleGrid>
                
                <Divider my={4} />
                
                <Heading size="md" mb={4}>Recent Activity</Heading>
                
                {selectedProject.files.length === 0 ? (
                  <Text color="gray.500">No files uploaded yet. Go to the Upload Files tab to get started.</Text>
                ) : (
                  <VStack align="stretch" spacing={2}>
                    {selectedProject.files.slice(-5).reverse().map((file, index) => (
                      <Card key={index} variant="outline" p={3} size="sm">
                        <HStack>
                          <Icon as={CheckIcon} color="green.500" />
                          <Text>
                            {file.fileType} file processed with {
                              file.fileType === 'CTR' 
                                ? `${file.summary.tasks} tasks and ${file.summary.resources} resources`
                                : `${file.summary.documents} documents`
                            }
                          </Text>
                        </HStack>
                      </Card>
                    ))}
                  </VStack>
                )}
              </TabPanel>
              
              {/* Upload Files Tab */}
              <TabPanel>
                <FileUploader 
                  projectId={selectedProject.id} 
                  onFileUploaded={handleFileUploaded} 
                />
              </TabPanel>
              
              {/* Generate WBS Tab */}
              <TabPanel>
                <WBSGenerator projectId={selectedProject.id} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </Card>
    );
  };
  
  return (
    <Container maxW="container.xl" py={6}>
      <Box mb={6}>
        <Heading as="h1" size="xl">PMFusion</Heading>
        <Text color="gray.600">EPC Project Management Tool</Text>
      </Box>
      
      <Flex direction={{ base: 'column', md: 'row' }} gap={4}>
        <Box width={{ base: '100%', md: '250px' }} flexShrink={0}>
          {renderProjectSidebar()}
        </Box>
        
        <Box flex="1">
          {renderProjectDashboard()}
        </Box>
      </Flex>
      
      {/* New Project Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired mb={4}>
              <FormLabel>Project Name</FormLabel>
              <Input 
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Description (Optional)</FormLabel>
              <Input 
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Enter project description"
              />
            </FormControl>
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={createProject}>
              Create Project
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default PMFusionApp;
