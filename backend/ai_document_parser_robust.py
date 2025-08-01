#!/usr/bin/env python3
"""
Robust AI-Powered Document Parser with Graceful Fallbacks

This module transforms raw document content into structured WBS output
with intelligent fallbacks when AI models are unavailable.
"""

import logging
import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Any
import pandas as pd

# Try to import AI dependencies with graceful fallback
AI_AVAILABLE = False
try:
    import pdfplumber
    from transformers import AutoTokenizer, AutoModelForCausalLM
    import torch
    AI_AVAILABLE = True
    logger = logging.getLogger(__name__)
    logger.info("✅ AI dependencies loaded successfully")
except Exception as e:
    logger = logging.getLogger(__name__)
    logger.warning(f"AI dependencies not available, using rule-based parsing: {e}")

class RobustAIDocumentParser:
    """Robust AI-powered document parser with intelligent fallbacks"""
    
    def __init__(self):
        # Use Microsoft Phi-3-mini - excellent for reasoning, completely open
        self.model_name = "microsoft/Phi-3-mini-4k-instruct"
        self.tokenizer = None
        self.model = None
        self.ai_enabled = AI_AVAILABLE
        
        if self.ai_enabled:
            self._try_initialize_model()
    
    def _try_initialize_model(self):
        """Try to initialize the Phi-3-mini model with error handling"""
        try:
            logger.info("🧠 Loading Microsoft Phi-3-mini model...")
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                trust_remote_code=True
            )
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float32,
                device_map="cpu",  # Force CPU loading to avoid disk offload issues
                trust_remote_code=True,
                low_cpu_mem_usage=True
            )
            
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
                
            logger.info("✅ Phi-3-mini model loaded successfully")
            
        except Exception as e:
            logger.warning(f"Failed to load Phi-3-mini model, using enhanced rule-based parsing: {e}")
            self.model = None
            self.tokenizer = None
    
    def extract_raw_content(self, file_path: Path) -> str:
        """Extract raw text content from various document types"""
        
        suffix = file_path.suffix.lower()
        
        if suffix == ".pdf":
            return self._extract_pdf_text(file_path)
        elif suffix in [".xlsx", ".xls"]:
            return self._extract_excel_text(file_path)
        elif suffix == ".csv":
            return self._extract_csv_text(file_path)
        elif suffix in [".txt", ".md"]:
            return file_path.read_text(encoding='utf-8')
        else:
            logger.warning(f"Unsupported file type: {suffix}")
            return ""
    
    def _extract_pdf_text(self, file_path: Path) -> str:
        """Extract text from PDF files"""
        try:
            if AI_AVAILABLE and 'pdfplumber' in globals():
                text_parts = []
                with pdfplumber.open(str(file_path)) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text() or ""
                        text_parts.append(page_text)
                return "\n".join(text_parts)
            else:
                logger.warning("pdfplumber not available, cannot extract PDF text")
                return ""
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            return ""
    
    def _extract_excel_text(self, file_path: Path) -> str:
        """Extract structured text from Excel files with intelligent header detection"""
        try:
            excel_data = []
            xls = pd.ExcelFile(file_path)
            
            for sheet_name in xls.sheet_names:
                # Read without header assumptions
                df_raw = pd.read_excel(xls, sheet_name=sheet_name, header=None)
                if df_raw.empty:
                    continue
                
                excel_data.append(f"Sheet: {sheet_name}")
                
                # Strategy 1: Look for deliverable/task names in key columns
                deliverables = self._extract_deliverables_from_sheet(df_raw)
                if deliverables:
                    excel_data.append("DELIVERABLES/TASKS:")
                    for deliverable in deliverables:
                        excel_data.append(f"- {deliverable}")
                    excel_data.append("")
                
                # Strategy 2: Try to find structured headers and data
                structured_data = self._extract_structured_data(df_raw)
                if structured_data:
                    excel_data.append("STRUCTURED DATA:")
                    excel_data.append(structured_data)
                    excel_data.append("")
                
                # Strategy 3: Fallback to simple CSV conversion (with intelligent header detection)
                if not deliverables and not structured_data:
                    df_clean = self._clean_dataframe(df_raw)
                    if not df_clean.empty:
                        excel_data.append(df_clean.to_csv(index=False))
                        excel_data.append("")
            
            return "\n".join(excel_data)
        except Exception as e:
            logger.error(f"Excel extraction failed: {e}")
            return ""
    
    def _extract_deliverables_from_sheet(self, df_raw: 'pd.DataFrame') -> List[str]:
        """Extract deliverable/task names from Excel sheet"""
        deliverables = []
        
        # Common patterns for task/deliverable identification
        task_patterns = [
            r'.*design.*', r'.*engineering.*', r'.*construction.*', r'.*installation.*',
            r'.*commissioning.*', r'.*testing.*', r'.*review.*', r'.*approval.*',
            r'.*basis.*', r'.*scope.*', r'.*plan.*', r'.*schedule.*', r'.*procedure.*',
            r'.*philosophy.*', r'.*calculation.*', r'.*safety.*', r'.*hazop.*', r'.*hazid.*'
        ]
        
        # Look through all cells for meaningful content
        for row_idx in range(min(50, len(df_raw))):  # Check first 50 rows
            for col_idx in range(min(20, len(df_raw.columns))):  # Check first 20 columns
                cell_value = df_raw.iloc[row_idx, col_idx]
                
                if pd.isna(cell_value):
                    continue
                    
                cell_str = str(cell_value).strip()
                
                # Skip short or numeric-only content
                if len(cell_str) < 5 or cell_str.isdigit():
                    continue
                
                # Check if cell contains deliverable-like content
                cell_lower = cell_str.lower()
                if any(re.search(pattern, cell_lower) for pattern in task_patterns):
                    if cell_str not in deliverables and len(cell_str) < 100:  # Avoid duplicates and overly long text
                        deliverables.append(cell_str)
        
        return deliverables[:20]  # Limit to 20 deliverables
    
    def _extract_structured_data(self, df_raw: 'pd.DataFrame') -> str:
        """Extract structured data with proper headers"""
        try:
            # Try to find header row (look for rows with many non-null values)
            best_header_row = 0
            max_non_null = 0
            
            for i in range(min(10, len(df_raw))):  # Check first 10 rows
                non_null_count = df_raw.iloc[i].notna().sum()
                if non_null_count > max_non_null:
                    max_non_null = non_null_count
                    best_header_row = i
            
            if max_non_null > 3:  # Must have at least 3 non-null headers
                # Extract data starting from header row
                df_structured = df_raw.iloc[best_header_row:].copy()
                df_structured.columns = [f"Col_{i}" if pd.isna(col) else str(col).strip() 
                                       for i, col in enumerate(df_structured.iloc[0])]
                df_structured = df_structured.iloc[1:].reset_index(drop=True)
                
                # Remove completely empty columns and rows
                df_structured = df_structured.dropna(how='all', axis=1).dropna(how='all', axis=0)
                
                if not df_structured.empty and len(df_structured) > 0:
                    return df_structured.head(10).to_csv(index=False)  # First 10 rows
            
            return ""
        except Exception as e:
            logger.debug(f"Structured data extraction failed: {e}")
            return ""
    
    def _clean_dataframe(self, df_raw: 'pd.DataFrame') -> 'pd.DataFrame':
        """Clean dataframe by removing empty rows/columns and setting proper headers"""
        try:
            # Remove completely empty rows and columns
            df_clean = df_raw.dropna(how='all', axis=0).dropna(how='all', axis=1)
            
            if df_clean.empty:
                return df_clean
            
            # Use first non-empty row as headers
            first_row = df_clean.iloc[0]
            df_clean.columns = [f"Column_{i}" if pd.isna(col) else str(col).strip()[:30] 
                              for i, col in enumerate(first_row)]
            df_clean = df_clean.iloc[1:].reset_index(drop=True)
            
            return df_clean.head(15)  # Limit to 15 rows
        except Exception as e:
            logger.debug(f"DataFrame cleaning failed: {e}")
            return df_raw
    
    def _extract_csv_text(self, file_path: Path) -> str:
        """Extract text from CSV files"""
        try:
            return file_path.read_text(encoding='utf-8')
        except Exception as e:
            logger.error(f"CSV extraction failed: {e}")
            return ""
    
    def intelligent_parse(self, raw_content: str, document_type: str = "project_document") -> List[Dict]:
        """Intelligently parse content using AI or enhanced rules"""
        
        if self.model and self.tokenizer:
            return self._ai_reasoning(raw_content, document_type)
        else:
            return self._enhanced_rule_based_parsing(raw_content)
    
    def _ai_reasoning(self, content: str, doc_type: str) -> List[Dict]:
        """Use Microsoft Phi-3-mini for enhanced engineering document reasoning"""
        
        # Preprocess content for better AI understanding
        processed_content = self._preprocess_content_for_ai(content, doc_type)
        
        # Create document-type specific prompt
        prompt = self._create_enhanced_prompt(processed_content, doc_type)
        
        logger.info(f"🧠 AI analyzing {len(processed_content)} chars of {doc_type} content")
        
        try:
            # Prepare inputs with proper attention mask
            inputs = self.tokenizer(
                prompt, 
                return_tensors="pt", 
                truncation=True, 
                max_length=2048,  # Increased for better context
                padding=True
            )
            
            with torch.no_grad():
                # Use simpler generation parameters to avoid cache issues
                outputs = self.model.generate(
                    input_ids=inputs['input_ids'],
                    attention_mask=inputs['attention_mask'],
                    max_new_tokens=500,  # Increased for more detailed output
                    temperature=0.2,     # Lower for more focused output
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    use_cache=False  # Disable cache to avoid DynamicCache issues
                )
            
            # Decode only the new tokens (skip the prompt)
            input_length = inputs['input_ids'].shape[1]
            response = self.tokenizer.decode(outputs[0][input_length:], skip_special_tokens=True)
            return self._extract_json_from_response(response)
            
        except Exception as e:
            logger.error(f"AI reasoning failed: {e}")
            logger.info("Falling back to enhanced rule-based parsing")
            return self._enhanced_rule_based_parsing(content)

    def _preprocess_content_for_ai(self, content: str, doc_type: str) -> str:
        """Intelligent preprocessing of content for better AI understanding"""
        
        # Step 1: Focus on most relevant sections
        lines = content.split('\n')
        relevant_lines = []
        
        # Engineering keywords that indicate important content
        important_keywords = [
            'design', 'engineering', 'construction', 'installation', 'commissioning',
            'testing', 'review', 'approval', 'basis', 'scope', 'plan', 'schedule',
            'procedure', 'philosophy', 'calculation', 'safety', 'hazop', 'hazid',
            'deliverable', 'document', 'milestone', 'activity', 'task', 'work',
            'management', 'control', 'system', 'equipment', 'structure', 'foundation',
            'piping', 'electrical', 'mechanical', 'instrumentation', 'process'
        ]
        
        for line in lines:
            line_lower = line.lower().strip()
            
            # Keep lines with important keywords
            if any(keyword in line_lower for keyword in important_keywords):
                relevant_lines.append(line.strip())
            
            # Keep lines that look like structured data (CSV-like)
            elif ',' in line and len(line.split(',')) >= 3:
                relevant_lines.append(line.strip())
            
            # Keep lines that look like deliverables/tasks
            elif (line.strip() and len(line.strip()) > 10 and 
                  any(char.isalpha() for char in line)):
                relevant_lines.append(line.strip())
        
        # Step 2: Limit content size and prioritize most relevant
        processed_content = '\n'.join(relevant_lines[:50])  # Top 50 relevant lines
        
        # Step 3: Add structure hints
        if 'DELIVERABLES/TASKS:' in processed_content:
            processed_content = f"ENGINEERING DELIVERABLES AND TASKS:\n{processed_content}"
        elif 'STRUCTURED DATA:' in processed_content:
            processed_content = f"PROJECT SCHEDULE DATA:\n{processed_content}"
        else:
            processed_content = f"PROJECT DOCUMENT CONTENT:\n{processed_content}"
        
        return processed_content[:1500]  # Final size limit for AI processing

    def _create_enhanced_prompt(self, content: str, doc_type: str) -> str:
        """Create document-type specific enhanced prompts for better AI reasoning"""
        
        # Base system prompt with engineering expertise
        system_prompt = """<|system|>
You are an expert project scheduler and engineering manager with 15+ years of experience in:
- Oil & Gas, Petrochemical, and Industrial projects
- Work Breakdown Structure (WBS) development
- Project planning and scheduling
- Engineering deliverable management
- Resource allocation and cost estimation

Your task is to analyze project documents and extract structured engineering tasks."""
        
        # Document-specific guidance
        if doc_type in ['.xlsx', '.xls'] and 'MDR' in content.upper():
            doc_guidance = """
This is a Master Document Register (MDR) containing engineering deliverables.
Focus on extracting:
- Document titles as task names
- Engineering disciplines (Process, Mechanical, Electrical, I&C, Civil, Structural)
- Delivery phases (IFR, IFA, IFC)
- Planned dates and milestones"""
            
        elif doc_type in ['.xlsx', '.xls'] and 'CTR' in content.upper():
            doc_guidance = """
This is a Cost Time Resource (CTR) schedule containing project activities.
Focus on extracting:
- Activity/task names
- Duration estimates
- Resource assignments
- Cost estimates
- WBS codes"""
            
        elif doc_type == '.pdf':
            doc_guidance = """
This is a Statement of Work (SOW) or project specification document.
Focus on extracting:
- Scope items and deliverables
- Technical requirements
- Engineering activities
- Contractor responsibilities"""
            
        else:
            doc_guidance = """
This is a general project document.
Focus on extracting identifiable engineering tasks, deliverables, and activities."""

        # Enhanced examples with real engineering context
        examples = """
EXAMPLE OUTPUT FORMAT (return only valid JSON array):
[
  {
    "title": "Process Flow Diagram Development",
    "duration": 15.0,
    "cost": 45000.0,
    "resource": "Process Engineering Team",
    "discipline": "Process",
    "description": "Develop process flow diagrams for main production units",
    "wbs_code": "1.2.1"
  },
  {
    "title": "Structural Foundation Design",
    "duration": 20.0,
    "cost": 75000.0,
    "resource": "Structural Engineering Team", 
    "discipline": "Civil",
    "description": "Design foundations for main equipment and structures",
    "wbs_code": "1.3.2"
  },
  {
    "title": "Instrument Index and Data Sheets",
    "duration": 12.0,
    "cost": 35000.0,
    "resource": "I&C Engineering Team",
    "discipline": "Instrumentation", 
    "description": "Prepare instrument index and detailed data sheets",
    "wbs_code": "1.4.1"
  }
]

DISCIPLINE MAPPING:
- Process: Process engineering, flow diagrams, P&IDs, process calculations
- Mechanical: Equipment specifications, rotating machinery, static equipment
- Electrical: Power systems, motor lists, electrical calculations, lighting
- Instrumentation: Control systems, instrumentation, automation, SCADA
- Civil: Foundations, structures, buildings, site preparation
- Piping: Piping design, pipe specs, isometrics, pipe stress analysis
- General: Project management, procedures, reviews, coordination

COST ESTIMATION GUIDELINES:
- Small tasks (< 1 week): $5,000 - $15,000
- Medium tasks (1-4 weeks): $15,000 - $50,000
- Large tasks (1-3 months): $50,000 - $200,000
- Major deliverables (> 3 months): $200,000+"""

        # Final prompt assembly
        user_prompt = f"""<|user|>
{doc_guidance}

{examples}

TASK: Extract engineering tasks from the document content below. Return ONLY a valid JSON array with no additional text.

DOCUMENT CONTENT:
{content}

<|assistant|>
["""

        return f"{system_prompt}\n{user_prompt}"
    
    def _enhanced_rule_based_parsing(self, content: str) -> List[Dict]:
        """Enhanced rule-based parsing with pattern recognition"""
        
        tasks = []
        lines = content.split('\n')
        
        # Enhanced patterns for task recognition
        task_patterns = [
            r'^\d+\.?\d*\s+(.+)',  # Numbered tasks
            r'^[-•*]\s*(.+)',       # Bulleted tasks
            r'Task\s*[:]\s*(.+)',   # "Task:" format
            r'Activity\s*[:]\s*(.+)', # "Activity:" format
        ]
        
        # Keywords that suggest tasks
        task_keywords = [
            'design', 'install', 'construct', 'test', 'commission', 
            'prepare', 'review', 'approve', 'fabricate', 'erect',
            'foundation', 'structural', 'electrical', 'mechanical',
            'piping', 'instrumentation', 'control', 'safety'
        ]
        
        for line in lines:
            line = line.strip()
            if len(line) < 5:  # Skip very short lines
                continue
            
            # Check if line matches task patterns
            is_task = False
            extracted_title = line
            
            for pattern in task_patterns:
                match = re.match(pattern, line, re.IGNORECASE)
                if match:
                    extracted_title = match.group(1).strip()
                    is_task = True
                    break
            
            # Check for task keywords
            if not is_task:
                line_lower = line.lower()
                if any(keyword in line_lower for keyword in task_keywords):
                    is_task = True
                    extracted_title = line
            
            # Try to extract structured data from CSV-like content
            if ',' in line and not is_task:
                parts = [p.strip() for p in line.split(',')]
                if len(parts) >= 3:
                    title = parts[0]
                    duration = self._extract_number(parts[1], 5.0)
                    cost = self._extract_number(parts[2], 10000.0)
                    resource = parts[3] if len(parts) > 3 else "Team"
                    
                    if any(keyword in title.lower() for keyword in task_keywords):
                        tasks.append({
                            "title": title,
                            "duration": duration,
                            "cost": cost,
                            "resource": resource,
                            "discipline": self._guess_discipline(title),
                            "description": title,
                            "wbs_code": f"{len(tasks)+1}"
                        })
                        continue
            
            if is_task:
                tasks.append({
                    "title": extracted_title[:60],  # Limit title length
                    "duration": self._estimate_duration(extracted_title),
                    "cost": self._estimate_cost(extracted_title),
                    "resource": self._guess_resource(extracted_title),
                    "discipline": self._guess_discipline(extracted_title),
                    "description": extracted_title,
                    "wbs_code": f"{len(tasks)+1}"
                })
        
        return tasks[:15]  # Limit to 15 tasks
    
    def _extract_number(self, text: str, default: float) -> float:
        """Extract numeric value from text"""
        try:
            # Remove non-numeric characters except decimal point
            cleaned = re.sub(r'[^\d.]', '', str(text))
            return float(cleaned) if cleaned else default
        except:
            return default
    
    def _estimate_duration(self, task_title: str) -> float:
        """Estimate task duration based on keywords"""
        title_lower = task_title.lower()
        
        if any(word in title_lower for word in ['design', 'engineering', 'review']):
            return 10.0
        elif any(word in title_lower for word in ['install', 'construction', 'fabricate']):
            return 15.0
        elif any(word in title_lower for word in ['test', 'commission', 'startup']):
            return 7.0
        elif any(word in title_lower for word in ['prepare', 'mobilize']):
            return 3.0
        else:
            return 5.0
    
    def _estimate_cost(self, task_title: str) -> float:
        """Estimate task cost based on keywords"""
        title_lower = task_title.lower()
        
        if any(word in title_lower for word in ['equipment', 'major', 'structural']):
            return 100000.0
        elif any(word in title_lower for word in ['electrical', 'mechanical', 'piping']):
            return 50000.0
        elif any(word in title_lower for word in ['design', 'engineering']):
            return 25000.0
        else:
            return 15000.0
    
    def _guess_resource(self, task_title: str) -> str:
        """Guess resource/team based on task content"""
        title_lower = task_title.lower()
        
        if 'electrical' in title_lower:
            return "Electrical Team"
        elif any(word in title_lower for word in ['mechanical', 'equipment']):
            return "Mechanical Team"
        elif any(word in title_lower for word in ['civil', 'foundation', 'concrete']):
            return "Civil Team"
        elif any(word in title_lower for word in ['structural', 'steel']):
            return "Structural Team"
        elif any(word in title_lower for word in ['piping', 'pipe']):
            return "Piping Team"
        elif any(word in title_lower for word in ['instrument', 'control']):
            return "I&C Team"
        else:
            return "Project Team"
    
    def _guess_discipline(self, task_title: str) -> str:
        """Guess engineering discipline"""
        title_lower = task_title.lower()
        
        if 'electrical' in title_lower:
            return "Electrical"
        elif 'mechanical' in title_lower:
            return "Mechanical"
        elif any(word in title_lower for word in ['civil', 'foundation']):
            return "Civil"
        elif 'structural' in title_lower:
            return "Structural"
        elif 'piping' in title_lower:
            return "Piping"
        elif any(word in title_lower for word in ['instrument', 'control']):
            return "Instrumentation"
        elif 'process' in title_lower:
            return "Process"
        else:
            return "General"
    
    def _extract_json_from_response(self, response: str) -> List[Dict]:
        """Enhanced JSON extraction from AI response with multiple parsing strategies"""
        
        logger.debug(f"AI Response: {response[:200]}...")
        
        # Strategy 1: Look for complete JSON array
        try:
            # Remove any leading/trailing text and find JSON
            json_patterns = [
                r'\[[\s\S]*?\]',  # Standard JSON array
                r'```json\s*(\[[\s\S]*?\])\s*```',  # JSON in code blocks
                r'```\s*(\[[\s\S]*?\])\s*```',  # JSON in generic code blocks
            ]
            
            for pattern in json_patterns:
                matches = re.findall(pattern, response, re.DOTALL)
                for match in matches:
                    json_str = match if isinstance(match, str) else match
                    try:
                        tasks = json.loads(json_str)
                        if isinstance(tasks, list) and tasks:
                            logger.info(f"✅ Successfully parsed {len(tasks)} tasks from AI response")
                            return self._validate_tasks(tasks)
                    except json.JSONDecodeError:
                        continue
        except Exception as e:
            logger.debug(f"JSON pattern matching failed: {e}")
        
        # Strategy 2: Try to fix common JSON issues and re-parse
        try:
            cleaned_response = self._clean_json_response(response)
            if cleaned_response:
                tasks = json.loads(cleaned_response)
                if isinstance(tasks, list) and tasks:
                    logger.info(f"✅ Successfully parsed {len(tasks)} tasks after JSON cleaning")
                    return self._validate_tasks(tasks)
        except Exception as e:
            logger.debug(f"JSON cleaning strategy failed: {e}")
        
        # Strategy 3: Extract individual task objects
        try:
            task_objects = self._extract_individual_tasks(response)
            if task_objects:
                logger.info(f"✅ Extracted {len(task_objects)} individual tasks from response")
                return self._validate_tasks(task_objects)
        except Exception as e:
            logger.debug(f"Individual task extraction failed: {e}")
        
        logger.warning("❌ Failed to extract valid JSON from AI response")
        return []
    
    def _clean_json_response(self, response: str) -> str:
        """Clean and fix common JSON formatting issues"""
        
        # Find the main JSON array
        start_idx = response.find('[')
        if start_idx == -1:
            return ""
        
        # Find matching closing bracket
        bracket_count = 0
        end_idx = -1
        for i, char in enumerate(response[start_idx:], start_idx):
            if char == '[':
                bracket_count += 1
            elif char == ']':
                bracket_count -= 1
                if bracket_count == 0:
                    end_idx = i + 1
                    break
        
        if end_idx == -1:
            # Try to find any closing bracket
            end_idx = response.rfind(']') + 1
            if end_idx == 0:
                return ""
        
        json_str = response[start_idx:end_idx]
        
        # Common fixes
        fixes = [
            (r',\s*}', '}'),  # Remove trailing commas before }
            (r',\s*]', ']'),  # Remove trailing commas before ]
            (r'}\s*{', '}, {'),  # Add missing commas between objects
            (r'(["\'])\s*:\s*([^"\'\[\{][^,\}\]]*)', r'\1: "\2"'),  # Quote unquoted values
        ]
        
        for pattern, replacement in fixes:
            json_str = re.sub(pattern, replacement, json_str)
        
        return json_str
    
    def _extract_individual_tasks(self, response: str) -> List[Dict]:
        """Extract individual task objects when full JSON parsing fails"""
        
        tasks = []
        
        # Look for individual objects in the response
        object_pattern = r'\{[^{}]*"title"[^{}]*\}'
        matches = re.findall(object_pattern, response, re.DOTALL)
        
        for match in matches:
            try:
                # Try to parse individual object
                task = json.loads(match)
                if isinstance(task, dict) and 'title' in task:
                    tasks.append(task)
            except:
                # Try manual extraction for this object
                manual_task = self._manual_extract_task(match)
                if manual_task:
                    tasks.append(manual_task)
        
        return tasks
    
    def _manual_extract_task(self, text: str) -> Dict:
        """Manually extract task information when JSON parsing fails"""
        
        task = {}
        
        # Extract common fields using regex
        patterns = {
            'title': r'"title"\s*:\s*"([^"]*)"',
            'duration': r'"duration"\s*:\s*([0-9.]+)',
            'cost': r'"cost"\s*:\s*([0-9.]+)',
            'resource': r'"resource"\s*:\s*"([^"]*)"',
            'discipline': r'"discipline"\s*:\s*"([^"]*)"',
            'description': r'"description"\s*:\s*"([^"]*)"',
            'wbs_code': r'"wbs_code"\s*:\s*"([^"]*)"'
        }
        
        for field, pattern in patterns.items():
            match = re.search(pattern, text)
            if match:
                value = match.group(1)
                if field in ['duration', 'cost']:
                    try:
                        task[field] = float(value)
                    except:
                        task[field] = 5.0 if field == 'duration' else 15000.0
                else:
                    task[field] = value
        
        # Only return if we have at least a title
        return task if 'title' in task else None
    
    def _validate_tasks(self, tasks: List[Dict]) -> List[Dict]:
        """Enhanced validation and enrichment of extracted tasks"""
        validated_tasks = []
        
        for i, task in enumerate(tasks):
            if not isinstance(task, dict):
                continue
                
            # Extract and clean basic fields
            title = str(task.get("title", f"Engineering Task {i+1}")).strip()
            if not title or len(title) < 3:
                continue  # Skip tasks with no meaningful title
            
            # Smart discipline detection
            discipline = self._smart_discipline_detection(
                task.get("discipline", ""), title, task.get("description", "")
            )
            
            # Intelligent duration estimation
            duration = self._smart_duration_estimation(
                task.get("duration"), title, discipline
            )
            
            # Intelligent cost estimation
            cost = self._smart_cost_estimation(
                task.get("cost"), title, discipline, duration
            )
            
            # Smart resource assignment
            resource = self._smart_resource_assignment(
                task.get("resource", ""), discipline, title
            )
            
            # Clean description
            description = str(task.get("description", "")).strip()
            if not description:
                description = f"Engineering deliverable: {title[:50]}"
            
            # Clean WBS code
            wbs_code = str(task.get("wbs_code", f"{i+1}")).strip()
            
            validated_task = {
                "title": title[:80],  # Reasonable title length
                "duration": duration,
                "cost": cost,
                "resource": resource,
                "discipline": discipline,
                "description": description[:200],  # Limit description length
                "wbs_code": wbs_code
            }
            
            validated_tasks.append(validated_task)
        
        logger.info(f"✅ Validated {len(validated_tasks)} engineering tasks")
        return validated_tasks
    
    def _smart_discipline_detection(self, provided_discipline: str, title: str, description: str) -> str:
        """Intelligently detect engineering discipline based on content"""
        
        # If valid discipline provided, use it
        valid_disciplines = ["Process", "Mechanical", "Electrical", "Instrumentation", "Civil", "Piping", "General"]
        if provided_discipline in valid_disciplines:
            return provided_discipline
        
        # Combine title and description for analysis
        content = f"{title} {description}".lower()
        
        # Discipline detection patterns
        discipline_patterns = {
            "Process": [
                "process", "flow", "p&id", "pfd", "distillation", "reaction", "separator",
                "heat exchanger", "reactor", "column", "process control", "process design"
            ],
            "Mechanical": [
                "mechanical", "pump", "compressor", "turbine", "equipment", "rotating",
                "static", "vessel", "tank", "machinery", "bearing", "coupling"
            ],
            "Electrical": [
                "electrical", "power", "motor", "cable", "switchgear", "transformer",
                "lighting", "grounding", "protection", "distribution", "substation"
            ],
            "Instrumentation": [
                "instrument", "control", "automation", "scada", "dcs", "plc", "valve",
                "transmitter", "indicator", "controller", "hmi", "logic", "interlock"
            ],
            "Civil": [
                "civil", "foundation", "concrete", "structural", "building", "road",
                "drainage", "excavation", "grading", "site", "architecture"
            ],
            "Piping": [
                "piping", "pipe", "isometric", "support", "stress", "routing",
                "piping design", "pipe spec", "pipeline", "fitting"
            ]
        }
        
        # Score each discipline
        discipline_scores = {}
        for discipline, keywords in discipline_patterns.items():
            score = sum(1 for keyword in keywords if keyword in content)
            if score > 0:
                discipline_scores[discipline] = score
        
        # Return the highest scoring discipline, or General if no clear match
        if discipline_scores:
            return max(discipline_scores, key=discipline_scores.get)
        else:
            return "General"
    
    def _smart_duration_estimation(self, provided_duration, title: str, discipline: str) -> float:
        """Intelligently estimate task duration based on content and discipline"""
        
        # If valid duration provided, use it
        if provided_duration and isinstance(provided_duration, (int, float)) and provided_duration > 0:
            return float(provided_duration)
        
        title_lower = title.lower()
        
        # Duration patterns based on task complexity
        if any(keyword in title_lower for keyword in ["basis", "philosophy", "specification", "standard"]):
            base_duration = 15.0  # Major documents
        elif any(keyword in title_lower for keyword in ["calculation", "sizing", "analysis"]):
            base_duration = 10.0  # Engineering calculations
        elif any(keyword in title_lower for keyword in ["review", "check", "approval"]):
            base_duration = 3.0   # Review activities
        elif any(keyword in title_lower for keyword in ["design", "engineering", "development"]):
            base_duration = 20.0  # Design work
        elif any(keyword in title_lower for keyword in ["installation", "construction", "fabrication"]):
            base_duration = 30.0  # Construction activities
        elif any(keyword in title_lower for keyword in ["testing", "commissioning", "startup"]):
            base_duration = 15.0  # Testing activities
        else:
            base_duration = 8.0   # Default for general tasks
        
        # Adjust based on discipline complexity
        discipline_multipliers = {
            "Process": 1.2,      # Process work often complex
            "Instrumentation": 1.1,  # I&C can be complex
            "Mechanical": 1.0,   # Standard complexity
            "Electrical": 1.0,   # Standard complexity
            "Civil": 0.9,        # Often more standardized
            "Piping": 1.1,       # Can be complex routing
            "General": 0.8       # Often simpler coordination
        }
        
        multiplier = discipline_multipliers.get(discipline, 1.0)
        estimated_duration = base_duration * multiplier
        
        # Round to reasonable values
        return round(estimated_duration, 1)
    
    def _smart_cost_estimation(self, provided_cost, title: str, discipline: str, duration: float) -> float:
        """Intelligently estimate task cost based on content, discipline, and duration"""
        
        # If valid cost provided, use it
        if provided_cost and isinstance(provided_cost, (int, float)) and provided_cost > 0:
            return float(provided_cost)
        
        # Base hourly rates by discipline (engineering rates)
        hourly_rates = {
            "Process": 180,       # Senior process engineers
            "Mechanical": 160,    # Mechanical engineers  
            "Electrical": 155,    # Electrical engineers
            "Instrumentation": 175,  # I&C specialists
            "Civil": 140,         # Civil/structural engineers
            "Piping": 150,        # Piping designers
            "General": 130        # General engineering support
        }
        
        base_rate = hourly_rates.get(discipline, 150)
        hours_per_day = 8
        
        # Task complexity multipliers
        title_lower = title.lower()
        complexity_multiplier = 1.0
        
        if any(keyword in title_lower for keyword in ["basis", "philosophy", "major", "critical"]):
            complexity_multiplier = 1.5  # High complexity
        elif any(keyword in title_lower for keyword in ["review", "check", "minor", "simple"]):
            complexity_multiplier = 0.7  # Lower complexity
        elif any(keyword in title_lower for keyword in ["calculation", "analysis", "study"]):
            complexity_multiplier = 1.2  # Moderate complexity
        
        # Calculate estimated cost
        estimated_cost = duration * hours_per_day * base_rate * complexity_multiplier
        
        # Round to reasonable values (nearest $1000)
        return round(estimated_cost / 1000) * 1000
    
    def _smart_resource_assignment(self, provided_resource: str, discipline: str, title: str) -> str:
        """Intelligently assign resources based on discipline and task type"""
        
        # If valid resource provided, use it
        if provided_resource and len(provided_resource.strip()) > 2:
            return provided_resource.strip()
        
        # Default resource assignments by discipline
        resource_mapping = {
            "Process": "Process Engineering Team",
            "Mechanical": "Mechanical Engineering Team", 
            "Electrical": "Electrical Engineering Team",
            "Instrumentation": "I&C Engineering Team",
            "Civil": "Civil Engineering Team",
            "Piping": "Piping Design Team",
            "General": "Project Team"
        }
        
        base_resource = resource_mapping.get(discipline, "Engineering Team")
        
        # Special cases based on title content
        title_lower = title.lower()
        if "senior" in title_lower or "lead" in title_lower:
            base_resource = f"Senior {base_resource}"
        elif "review" in title_lower or "approval" in title_lower:
            base_resource = f"{base_resource} Lead"
        
        return base_resource
    
    def parse_document(self, file_path: Path) -> Dict[str, List[Dict]]:
        """Main parsing function"""
        logger.info(f"🔍 Parsing document: {file_path.name}")
        
        # Extract raw content
        raw_content = self.extract_raw_content(file_path)
        if not raw_content.strip():
            logger.warning("No content extracted")
            return {"tasks": []}
        
        logger.info(f"📄 Extracted {len(raw_content)} characters")
        
        # Parse with AI or rules
        tasks = self.intelligent_parse(raw_content, file_path.suffix)
        
        mode = "AI" if (self.model and self.tokenizer) else "Rule-based"
        logger.info(f"🎯 {mode} parsing extracted {len(tasks)} tasks")
        
        return {"tasks": tasks}


# Global instance
robust_ai_parser = RobustAIDocumentParser()

def robust_parse_document(file_path: Path) -> Dict[str, List[Dict]]:
    """Function to integrate with existing code"""
    return robust_ai_parser.parse_document(file_path)


if __name__ == "__main__":
    print("🧪 Testing Robust AI Document Parser")
    
    # Show capabilities
    if robust_ai_parser.ai_enabled:
        if robust_ai_parser.model:
            print("🧠 AI Mode: Microsoft Phi-3-mini ready")
        else:
            print("🔧 Enhanced Rule-based Mode: AI libraries available")
    else:
        print("📋 Rule-based Mode: No AI dependencies")
    
    # Test with demo file
    demo_file = Path("../demo_ctr_schedule.xlsx")
    if demo_file.exists():
        print(f"\n📊 Testing with: {demo_file.name}")
        result = robust_ai_parser.parse_document(demo_file)
        tasks = result.get('tasks', [])
        print(f"✅ Extracted {len(tasks)} tasks:")
        
        for i, task in enumerate(tasks[:5]):
            print(f"  {i+1:2d}. {task['title']} | {task['duration']} days | ${task['cost']:,.0f} | {task['resource']}")
        
        if len(tasks) > 5:
            print(f"     ... and {len(tasks) - 5} more tasks")
    else:
        print(f"❌ Demo file not found: {demo_file}")
        
    print(f"\n🎯 Ready for integration with existing WBS creation workflow!") 