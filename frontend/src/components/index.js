export * from './icons';
export { default as DeleteConfirmModal } from './modals/DeleteConfirmModal';
export { PriorityBadge, StatusBadge, StoryPointBadge, EpicBadge, SprintBadge } from './Badges';
export { default as ProgressBar } from './ProgressBar';

import * as Icons from './icons';
import DeleteConfirmModal from './modals/DeleteConfirmModal';
import { PriorityBadge, StatusBadge, StoryPointBadge, EpicBadge, SprintBadge } from './Badges';
import ProgressBar from './ProgressBar';
import { TaskCard, GanttChart, ResourceManagement, DragDropKanbanBoard } from '../Components';

const Components = {
  ...Icons,
  DeleteConfirmModal,
  PriorityBadge,
  StatusBadge,
  StoryPointBadge,
  EpicBadge,
  SprintBadge,
  ProgressBar,
  TaskCard,
  GanttChart,
  ResourceManagement,
  DragDropKanbanBoard,
};

export default Components;
