# PMFusion Frontend Rebuild Roadmap

## Executive Summary

This document outlines the focused implementation plan to rebuild the PMFusion frontend with proper three-phase workflow integration, role-based personalized views, and real-time cross-phase synchronization. The rebuild aligns with the existing backend API and delivers a production-ready EPC project management system.

## Current State Analysis

### ✅ What's Working
- Supabase authentication with user profiles
- Basic project creation and listing
- Comprehensive backend API (50+ endpoints)
- Component structure foundation
- Basic role-based navigation framework

### ❌ Critical Problems Identified

#### 1. **Role Mismatch Crisis**
```javascript
// CURRENT FRONTEND (Wrong)
ROLE_VIEWS = {
  admin: [...], scheduler: [...], team_lead: [...], team_member: [...], dcc: [...]
};

// ACTUAL BACKEND (Correct)
UserRole = {
  PROJECT_MANAGER, ENGINEERING_MANAGER, CONTRACTOR,
  SENIOR_ENGINEER_1, SENIOR_ENGINEER_2, INTERMEDIATE_ENGINEER, 
  JUNIOR_ENGINEER, SCHEDULER
};
```

#### 2. **Limited Backend Integration**
- Frontend uses mostly mock data
- Only basic API calls implemented  
- 50+ backend endpoints available but unused

#### 3. **No Three-Phase Workflow**
- Generic views for all users
- No phase-specific workflows
- Missing cross-phase communication

#### 4. **No Real-Time Synchronization**
- Manual refresh only
- No cross-phase updates
- Missing workflow state sync

## Implementation Strategy

### Core Principles
1. **Backend-First Alignment**: Frontend matches existing backend exactly
2. **Phase-Specific Views**: Each user sees only their workflow phase
3. **Real-Time Sync**: Live updates across all phases
4. **Role-Based Access**: Personalized navigation and permissions

## Detailed Implementation Plan

---

## **PHASE 1: Foundation Fix (Week 1)**

### **Deliverable 1.1: Role System Alignment**
**Timeline**: Days 1-2

#### Backend Role Mapping
```typescript
const BACKEND_ROLE_MAPPING = {
  // Phase 1: Project Creation
  'scheduler': {
    phase: 'creation',
    views: ['dashboard', 'create-project', 'wbs-management', 'project-overview'],
    permissions: ['create_project', 'generate_wbs', 'manage_disciplines']
  },
  
  // Phase 2: Teams Execution  
  'project_manager': {
    phase: 'execution-lead',
    views: ['dashboard', 'project-kanban', 'team-management', 'resources'],
    permissions: ['assign_tasks', 'approve_documents', 'manage_team']
  },
  'engineering_manager': {
    phase: 'execution-lead', 
    views: ['dashboard', 'discipline-kanban', 'team-oversight', 'reports'],
    permissions: ['assign_tasks', 'review_work', 'manage_discipline']
  },
  'senior_engineer_1': {
    phase: 'execution',
    views: ['dashboard', 'my-tasks', 'document-review'],
    permissions: ['complete_tasks', 'review_junior_work', 'upload_documents']
  },
  'intermediate_engineer': {
    phase: 'execution',
    views: ['dashboard', 'my-tasks'],
    permissions: ['complete_tasks', 'upload_documents']
  },
  'junior_engineer': {
    phase: 'execution-basic',
    views: ['dashboard', 'my-assigned-tasks'],
    permissions: ['complete_assigned_tasks']
  },
  
  // Phase 3: Document Control
  'dcc_officer': {
    phase: 'control',
    views: ['dashboard', 'dcc-queue', 'client-submissions', 'approvals'],
    permissions: ['manage_dcc_queue', 'send_to_client', 'track_approvals']
  }
};
```

**Acceptance Criteria**:
- [ ] All frontend roles match backend UserRole enum exactly
- [ ] Role-based navigation uses correct backend roles
- [ ] Permission system aligned with backend capabilities

### **Deliverable 1.2: TypeScript Interface Alignment**
**Timeline**: Days 2-3

#### Backend Model Interfaces
```typescript
// Match exact backend models
interface User {
  id: string;
  name: string;
  email: string;
  role: 'project_manager' | 'engineering_manager' | 'contractor' | 
         'senior_engineer_1' | 'senior_engineer_2' | 'intermediate_engineer' | 
         'junior_engineer' | 'scheduler';
  discipline: string | null;
  hourly_rate: number | null;
  availability: number;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: string | null;
  project_id: string | null;
  discipline: string | null;
  // ... all backend Task fields
}

interface Document {
  id: string;
  title: string;
  status: 'draft' | 'under_review' | 'approved' | 'superseded' | 'archived';
  review_step: 'dic' | 'idc' | 'dcc';
  category: DocumentCategory;
  // ... all backend Document fields
}
```

**Acceptance Criteria**:
- [ ] All TypeScript interfaces match backend models 100%
- [ ] No frontend-specific fields that don't exist in backend
- [ ] Proper enum types for all status fields

### **Deliverable 1.3: Real API Client Implementation**
**Timeline**: Days 3-5

#### Complete Backend Integration
```typescript
class PMFusionAPIClient {
  // Projects
  async getProjects(): Promise<Project[]> { return this.get('/api/projects'); }
  async createProject(data: ProjectCreate): Promise<Project> { return this.post('/api/projects', data); }
  
  // Tasks & Kanban
  async getTasks(filters?: TaskFilters): Promise<Task[]> { return this.get('/api/tasks', { params: filters }); }
  async getDisciplineKanban(discipline: string): Promise<KanbanData> { 
    return this.get(`/api/disciplines/${discipline}/kanban`); 
  }
  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    return this.put(`/api/tasks/${taskId}`, { status });
  }
  
  // WBS & CPM
  async generateWBS(projectId: string): Promise<WBSNode[]> { 
    return this.post(`/api/projects/${projectId}/wbs`); 
  }
  async getProjectWBS(projectId: string): Promise<WBSNode[]> { 
    return this.get(`/api/projects/${projectId}/wbs`); 
  }
  async getProjectGantt(projectId: string): Promise<GanttData> { 
    return this.get(`/api/projects/${projectId}/gantt`); 
  }
  
  // Documents & DCC
  async getDocuments(filters?: DocumentFilters): Promise<Document[]> { 
    return this.get('/api/documents', { params: filters }); 
  }
  async getDCCQueue(): Promise<Document[]> { return this.get('/api/documents/dcc'); }
  async finalizeDocument(docId: string): Promise<void> { 
    return this.post(`/api/documents/${docId}/dcc_finalize`); 
  }
  async advanceDocumentReview(docId: string): Promise<void> { 
    return this.post(`/api/documents/${docId}/advance_review`); 
  }
  
  // Dashboard & Analytics
  async getDashboardStats(): Promise<DashboardStats> { return this.get('/api/dashboard/stats'); }
  async getProjectDashboard(projectId: string): Promise<DashboardStats> { 
    return this.get(`/api/projects/${projectId}/dashboard`); 
  }
  async getDocumentAnalytics(projectId?: string): Promise<DocumentAnalytics> { 
    return this.get('/api/documents/analytics/summary', { params: { project_id: projectId } }); 
  }
  
  // Use ALL 50+ actual backend endpoints
}
```

**Acceptance Criteria**:
- [ ] All 50+ backend endpoints integrated
- [ ] Replace all mock data with real API calls
- [ ] Proper error handling and loading states
- [ ] Authentication headers included in all requests

---

## **PHASE 2: Three-Phase Workflow UI (Week 2-3)**

### **Deliverable 2.1: Scheduler Phase - Project Creation**
**Timeline**: Days 6-8

#### Scheduler Dashboard & Tools
```typescript
const SchedulerDashboard = () => {
  const { data: projects } = useQuery(['projects'], api.getProjects);
  const { data: wbsStatus } = useQuery(['wbs-status'], api.getWBSStatus);
  
  return (
    <SchedulerLayout>
      <ProjectCreationSection>
        <CreateProjectWizard />
        <ProjectsList />
      </ProjectCreationSection>
      
      <WBSManagementSection>
        <WBSGenerator />
        <CPMCalculator />
        <CriticalPathVisualization />
      </WBSManagementSection>
      
      <DisciplineManagement>
        <DisciplineRegister />
        <TaskSyncStatus />
      </DisciplineManagement>
      
      <ProjectOverview>
        <OverallProgressMetrics />
        <MilestoneTracking />
      </ProjectOverview>
    </SchedulerLayout>
  );
};
```

**Scheduler Features**:
- [ ] Project creation wizard with document intake
- [ ] WBS generation using backend CPM engine
- [ ] Critical path calculation and visualization  
- [ ] Discipline setup and management
- [ ] Task sync to team kanban boards
- [ ] Overall project progress tracking

### **Deliverable 2.2: Teams Phase - Task Execution**
**Timeline**: Days 9-12

#### Team Dashboard by Role Level
```typescript
// Project/Engineering Manager View
const ManagerDashboard = ({ userRole, discipline }) => {
  return (
    <ManagerLayout>
      <TeamOverview>
        <DisciplineKanban discipline={discipline} canAssign={true} />
        <TeamMemberManagement />
        <ResourceAllocation />
      </TeamOverview>
      
      <DocumentReview>
        <PendingReviews />
        <ApprovalWorkflow />
      </DocumentReview>
    </ManagerLayout>
  );
};

// Senior Engineer View
const SeniorEngineerDashboard = ({ discipline }) => {
  return (
    <EngineerLayout>
      <MyWork>
        <AssignedTasks />
        <DocumentUpload />
      </MyWork>
      
      <ReviewWork>
        <JuniorWorkReview />
        <PeerReview />
      </ReviewWork>
    </EngineerLayout>
  );
};

// Junior Engineer View (Simplified)
const JuniorEngineerDashboard = () => {
  return (
    <BasicLayout>
      <MyAssignments>
        <TaskList viewMode="assigned-only" />
        <TaskProgress />
      </MyAssignments>
    </BasicLayout>
  );
};
```

**Team Features**:
- [ ] Role-appropriate kanban views (managers see all, engineers see assigned)
- [ ] Task assignment and status updates
- [ ] Document upload and version control
- [ ] DIC/IDC review workflow
- [ ] Real-time task collaboration
- [ ] Discipline-specific dashboards

### **Deliverable 2.3: DCC Phase - Document Control**
**Timeline**: Days 13-15

#### DCC Dashboard & Workflow
```typescript
const DCCDashboard = () => {
  const { data: dccQueue } = useQuery(['dcc-queue'], api.getDCCQueue);
  const { data: clientStatus } = useQuery(['client-status'], api.getClientStatus);
  
  return (
    <DCCLayout>
      <DocumentQueue>
        <IncomingDocuments documents={dccQueue} />
        <BulkActions />
        <QueueFilters />
      </DocumentQueue>
      
      <ClientManagement>
        <OutboundTracker />
        <ClientSubmissions />
        <ApprovalStatus />
      </ClientManagement>
      
      <FeedbackLoop>
        <ClientFeedbackProcessor />
        <ReturnToTeamsWorkflow />
      </FeedbackLoop>
      
      <Analytics>
        <DocumentMetrics />
        <ApprovalRates />
        <LeadTimeAnalysis />
      </Analytics>
    </DCCLayout>
  );
};
```

**DCC Features**:
- [ ] Document queue management
- [ ] Bulk send to client functionality
- [ ] Client submission tracking
- [ ] Approval/rejection workflow
- [ ] Feedback loop back to teams
- [ ] Document analytics and reporting

---

## **PHASE 3: Real-Time Cross-Phase Sync (Week 4)**

### **Deliverable 3.1: Workflow State Synchronization**
**Timeline**: Days 16-18

#### Cross-Phase Event System
```typescript
const useWorkflowSync = (projectId: string) => {
  useEffect(() => {
    // Scheduler → Teams: Project creation triggers task sync
    const projectChannel = supabase.channel(`project-${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'projects'
      }, (payload) => {
        notifyTeamPhases('new_project_tasks', payload);
        showNotification('New project tasks available!');
      })
      .subscribe();

    // Teams → DCC: Task completion triggers document review
    const taskChannel = supabase.channel(`tasks-${projectId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tasks',
        filter: `status=eq.done`
      }, (payload) => {
        notifyDCCPhase('document_ready_for_review', payload);
        addToDCCQueue(payload.new.id);
      })
      .subscribe();

    // DCC → Scheduler: Document approval triggers milestone update
    const docChannel = supabase.channel(`documents-${projectId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'documents',
        filter: `status=eq.approved`
      }, (payload) => {
        notifySchedulerPhase('milestone_achieved', payload);
        updateProjectProgress(projectId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(docChannel);
    };
  }, [projectId]);
};
```

**Real-Time Features**:
- [ ] Live task updates across all kanban boards
- [ ] Automatic document queue updates
- [ ] Cross-phase progress notifications
- [ ] Real-time milestone tracking
- [ ] Live collaboration indicators

### **Deliverable 3.2: Live Notification System**
**Timeline**: Days 19-20

#### Phase-Specific Notifications
```typescript
const NotificationSystem = {
  // Scheduler notifications
  notifyScheduler: (type, payload) => {
    switch(type) {
      case 'task_progress':
        showToast(`${payload.discipline} completed task: ${payload.title}`);
        break;
      case 'milestone_reached':
        showAlert(`🎉 Milestone achieved! Document approved: ${payload.document_title}`);
        break;
    }
  },
  
  // Team notifications  
  notifyTeam: (type, payload) => {
    switch(type) {
      case 'task_assigned':
        showToast(`New task assigned: ${payload.title}`);
        break;
      case 'review_feedback':
        showAlert(`Document review feedback received for: ${payload.title}`);
        break;
    }
  },
  
  // DCC notifications
  notifyDCC: (type, payload) => {
    switch(type) {
      case 'document_ready':
        showToast(`New document ready for client review: ${payload.title}`);
        break;
      case 'client_feedback':
        showAlert(`Client feedback received for: ${payload.title}`);
        break;
    }
  }
};
```

---

## **PHASE 4: Integration & Testing (Week 5-6)**

### **Deliverable 4.1: End-to-End Workflow Testing**
**Timeline**: Days 21-25

#### Complete Workflow Validation
```typescript
// Test complete workflow from creation to approval
describe('Three-Phase Workflow Integration', () => {
  test('Scheduler creates project → Teams see tasks → DCC processes documents', async () => {
    // Phase 1: Scheduler creates project
    const project = await scheduler.createProject(projectData);
    const wbs = await scheduler.generateWBS(project.id);
    
    // Verify: Teams see synced tasks
    const teamTasks = await teams.getDisciplineTasks('mechanical');
    expect(teamTasks).toHaveLength(wbs.filter(n => n.discipline === 'mechanical').length);
    
    // Phase 2: Team completes tasks
    await teams.completeTask(teamTasks[0].id);
    await teams.uploadDocument(teamTasks[0].id, mockDocument);
    
    // Verify: DCC sees documents
    const dccQueue = await dcc.getDocumentQueue();
    expect(dccQueue).toContainEqual(expect.objectContaining({ task_id: teamTasks[0].id }));
    
    // Phase 3: DCC approves document
    await dcc.approveDocument(dccQueue[0].id);
    
    // Verify: Scheduler sees progress
    const projectProgress = await scheduler.getProjectProgress(project.id);
    expect(projectProgress.completion_percentage).toBeGreaterThan(0);
  });
});
```

**Testing Coverage**:
- [ ] Scheduler can create projects and generate WBS
- [ ] Tasks automatically sync to appropriate discipline kanban boards  
- [ ] Team members can complete tasks and upload documents
- [ ] Document review workflow (DIC → IDC → DCC) functions correctly
- [ ] DCC can manage document queue and send to clients
- [ ] Real-time updates work across all phases
- [ ] Role-based access control enforced throughout

### **Deliverable 4.2: Performance & UX Optimization**
**Timeline**: Days 26-30

#### Production Readiness
- [ ] Lazy loading for large kanban boards
- [ ] Optimistic UI updates for better responsiveness  
- [ ] Error boundary components with graceful degradation
- [ ] Loading states for all async operations
- [ ] Mobile-responsive design for field use
- [ ] Offline capability for basic task viewing
- [ ] Performance monitoring and optimization

## Success Criteria

### **Functional Requirements Met**
1. **Scheduler Experience**: Can create projects, generate WBS, track overall progress ✅
2. **Team Experience**: See only relevant tasks, complete work, participate in reviews ✅  
3. **DCC Experience**: Manage document queue, handle client communications ✅
4. **Cross-Phase Sync**: Real-time updates flow between all phases ✅

### **Technical Requirements Met**
1. **Backend Alignment**: 100% compatibility with existing API ✅
2. **Role-Based Access**: Personalized views per user role ✅
3. **Real-Time Updates**: Live collaboration across phases ✅
4. **Production Ready**: Scalable, performant, error-resilient ✅

## Risk Mitigation

### **High Risk**: Scope Creep
**Mitigation**: Strict adherence to this roadmap, weekly progress reviews

### **Medium Risk**: Backend Integration Issues  
**Mitigation**: Start with backend endpoint validation, test early and often

### **Low Risk**: Real-Time Performance
**Mitigation**: Implement debouncing and optimize Supabase queries

## Maintenance & Updates

This document will be updated weekly during implementation to reflect:
- [ ] Completed deliverables  
- [ ] Discovered issues and solutions
- [ ] Timeline adjustments if needed
- [ ] Additional requirements discovered

---

**Document Version**: 1.0  
**Created**: {{ Date }}  
**Last Updated**: {{ Date }}  
**Next Review**: Weekly during implementation 