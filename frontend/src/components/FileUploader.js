import React, { useState } from 'react';
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
  FormHelperText,
  Card,
  CardBody,
  CardHeader,
  Heading
} from '@chakra-ui/react';
import { AttachmentIcon, CheckCircleIcon } from '@chakra-ui/icons';

const FileUploader = ({ projectId, onFileUploaded }) => {
  const [fileType, setFileType] = useState('CTR');
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedFileId, setUploadedFileId] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseResult, setParseResult] = useState(null);
  
  const toast = useToast();
  
  // File validation
  const validateFile = (file) => {
    if (!file) return false;
    
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError(`Invalid file format. Please upload Excel (.xlsx, .xls) or CSV (.csv) files.`);
      return false;
    }
    
    setError(null);
    return true;
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
      setError(null);
      setUploadedFileId(null);
      setParseResult(null);
    } else if (!file) {
      setSelectedFile(null);
    }
  };
  
  // Handle file type selection
  const handleFileTypeChange = (e) => {
    setFileType(e.target.value);
    setUploadedFileId(null);
    setParseResult(null);
  };
  
  // Handle description change
  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };
  
  // Upload file to server
  const uploadFile = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }
    
    if (!projectId) {
      setError('Project ID is required.');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('project_id', projectId);
    
    if (description) {
      formData.append('description', description);
    }
    
    try {
      const endpoint = fileType === 'CTR' 
        ? '/api/pmfusion/upload/ctr' 
        : '/api/pmfusion/upload/mdr';
      
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });
      
      setUploadedFileId(response.data.file_id);
      
      toast({
        title: 'File uploaded successfully.',
        description: `${fileType} file "${selectedFile.name}" has been uploaded.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Start parsing the file
      parseFile(response.data.file_id);
      
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(
        err.response?.data?.detail || 
        'An error occurred while uploading the file. Please try again.'
      );
      
      toast({
        title: 'Upload failed.',
        description: err.response?.data?.detail || 'Failed to upload file.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Parse the uploaded file
  const parseFile = async (fileId) => {
    setIsParsing(true);
    setParseProgress(0);
    
    try {
      // Simulate parse progress
      const progressInterval = setInterval(() => {
        setParseProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);
      
      const response = await axios.post(`/api/pmfusion/parse/file/${fileId}`);
      
      clearInterval(progressInterval);
      setParseProgress(100);
      setParseResult(response.data);
      
      toast({
        title: 'File parsed successfully.',
        description: `${fileType} file has been parsed and data extracted.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Notify parent component
      if (onFileUploaded) {
        onFileUploaded({
          fileId: fileId,
          fileType: fileType,
          parsedDataId: response.data.parsed_data_id,
          summary: response.data.summary
        });
      }
      
    } catch (err) {
      console.error('Error parsing file:', err);
      setError(
        err.response?.data?.detail || 
        'An error occurred while parsing the file. Please try again.'
      );
      
      toast({
        title: 'Parsing failed.',
        description: err.response?.data?.detail || 'Failed to parse file.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsParsing(false);
    }
  };
  
  // Reset the form
  const resetForm = () => {
    setSelectedFile(null);
    setDescription('');
    setError(null);
    setUploadedFileId(null);
    setUploadProgress(0);
    setParseResult(null);
    setParseProgress(0);
    
    // Reset the file input
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  return (
    <Card variant="outline" width="100%" mb={4}>
      <CardHeader>
        <Heading size="md">Upload {fileType} File</Heading>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {/* File Type Selection */}
          <FormControl>
            <FormLabel>File Type</FormLabel>
            <Select 
              value={fileType} 
              onChange={handleFileTypeChange}
              isDisabled={isUploading || isParsing}
            >
              <option value="CTR">CTR (Costs, Tasks, Resources)</option>
              <option value="MDR">MDR (Master Document Register)</option>
            </Select>
            <FormHelperText>
              {fileType === 'CTR' 
                ? 'Upload a file containing tasks, resource rates, and approved man-hours.' 
                : 'Upload a file containing document titles, codes, due dates, and disciplines.'}
            </FormHelperText>
          </FormControl>
          
          {/* File Selection */}
          <FormControl isRequired>
            <FormLabel>Select File</FormLabel>
            <Input
              id="file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              isDisabled={isUploading || isParsing}
              p={1}
            />
            <FormHelperText>
              Supported formats: Excel (.xlsx, .xls) or CSV (.csv)
            </FormHelperText>
          </FormControl>
          
          {/* File Description */}
          <FormControl>
            <FormLabel>Description (Optional)</FormLabel>
            <Textarea
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Enter a description for this file"
              isDisabled={isUploading || isParsing}
            />
          </FormControl>
          
          {/* Error Display */}
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Upload Progress */}
          {isUploading && (
            <Box>
              <Text mb={2}>Uploading: {uploadProgress}%</Text>
              <Progress value={uploadProgress} size="sm" colorScheme="blue" borderRadius="md" />
            </Box>
          )}
          
          {/* Parse Progress */}
          {isParsing && (
            <Box>
              <Text mb={2}>Parsing file: {parseProgress}%</Text>
              <Progress value={parseProgress} size="sm" colorScheme="green" borderRadius="md" />
            </Box>
          )}
          
          {/* Parse Result Summary */}
          {parseResult && (
            <Alert status="success" borderRadius="md">
              <AlertIcon as={CheckCircleIcon} />
              <Box>
                <AlertTitle>File Processed Successfully</AlertTitle>
                <AlertDescription>
                  <VStack align="start" spacing={1}>
                    <Text>File ID: {parseResult.file_id}</Text>
                    <Text>Parsed Data ID: {parseResult.parsed_data_id}</Text>
                    {parseResult.file_type === 'CTR' && (
                      <>
                        <Text>Tasks: {parseResult.summary.tasks}</Text>
                        <Text>Resources: {parseResult.summary.resources}</Text>
                        <Text>Task-Resource Assignments: {parseResult.summary.task_resources}</Text>
                      </>
                    )}
                    {parseResult.file_type === 'MDR' && (
                      <Text>Documents: {parseResult.summary.documents}</Text>
                    )}
                  </VStack>
                </AlertDescription>
              </Box>
            </Alert>
          )}
          
          {/* Action Buttons */}
          <HStack spacing={4} justify="flex-end">
            <Button 
              onClick={resetForm} 
              isDisabled={isUploading || isParsing}
              variant="outline"
            >
              Reset
            </Button>
            <Button
              colorScheme="blue"
              leftIcon={<AttachmentIcon />}
              onClick={uploadFile}
              isLoading={isUploading || isParsing}
              loadingText={isUploading ? "Uploading..." : "Parsing..."}
              isDisabled={!selectedFile || isUploading || isParsing}
            >
              Upload {fileType} File
            </Button>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default FileUploader;
