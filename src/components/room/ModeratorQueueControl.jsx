// src/components/room/ModeratorQueueControl.jsx
import React from 'react';
import { css } from '@emotion/css';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ModeratorBadge from '../ui/ModeratorBadge';
import AdminBadge from '../ui/AdminBadge';

function SortableItem({ id, player, currentPlayer, isModerator, isAdmin, isOnAppointment, getAppointmentTime, index }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const itemStyle = css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background-color: white;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
    cursor: grab;
    user-select: none;
    
    &:active {
      cursor: grabbing;
    }
    
    .player-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .position {
      font-weight: 600;
      color: #a47148;
      margin-right: 0.5rem;
    }
    
    .you-badge {
      font-size: 0.75rem;
      color: #a47148;
      font-weight: 600;
    }
    
    .drag-handle {
      color: #a47148;
      font-size: 1.25rem;
    }
  `;

  // New style for the appointment banner
  const appointmentBanner = css`
    display: inline-flex;
    align-items: center;
    background-color: #9c27b0; /* Bright purple color */
    color: white;
    font-family: Poppins, sans-serif;
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    margin-left: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    
    .appointment-time {
      font-size: 0.625rem;
      margin-left: 0.25rem;
      opacity: 0.9;
    }
  `;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={itemStyle}>
      <div className="player-info">
        <span className="position">#{index + 1}</span>
        {player}
        {player === currentPlayer && <span className="you-badge">(You)</span>}
        {isAdmin && isAdmin(player) && <AdminBadge />}
        {isModerator && isModerator(player) && <ModeratorBadge />}
        
        {/* Show appointment banner if player is on appointment */}
        {isOnAppointment && getAppointmentTime && isOnAppointment(player) && (
          <div className={appointmentBanner}>
            ON APPOINTMENT
            <span className="appointment-time">
              {getAppointmentTime(player)}
            </span>
          </div>
        )}
      </div>
      <div className="drag-handle">⋮⋮</div>
    </div>
  );
}

export default function ModeratorQueueControl({ queue, currentPlayer, isModerator, isAdmin, isOnAppointment, getAppointmentTime, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = queue.indexOf(active.id);
      const newIndex = queue.indexOf(over.id);
      
      const newQueue = arrayMove(queue, oldIndex, newIndex);
      onReorder(newQueue);
    }
  };

  const containerStyle = css`
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 0.5rem;
  `;

  const titleStyle = css`
    font-family: Poppins, sans-serif;
    font-weight: 600;
    color: #4b3b2b;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  `;

  return (
    <div className={containerStyle}>
      <div className={titleStyle}>
        🔄 Drag to reorder queue (Moderator Control)
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={queue}
          strategy={verticalListSortingStrategy}
        >
          {queue.map((player, index) => (
            <SortableItem
              key={player}
              id={player}
              player={player}
              currentPlayer={currentPlayer}
              isModerator={isModerator}
              isAdmin={isAdmin}
              isOnAppointment={isOnAppointment}
              getAppointmentTime={getAppointmentTime}
              index={index}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}