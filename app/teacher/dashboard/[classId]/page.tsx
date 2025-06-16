'use client';

import TopicFlow from '@/components/TopicFlow';
import { useEffect } from 'react';

export default function TopicTimeline() {
  useEffect(() => {
    const draggables = document.querySelectorAll('[draggable=true]');
    const dropzones = document.querySelectorAll('.dropzone');

    draggables.forEach((el) => {
      el.addEventListener('dragstart', (e) => {
        const dragEvent = e as DragEvent;
        dragEvent.dataTransfer?.setData('text/plain', (e.target as HTMLElement).dataset.topic || '');
      });
    });

    dropzones.forEach((zone) => {
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('bg-green-100');
      });

      zone.addEventListener('dragleave', () => {
        zone.classList.remove('bg-green-100');
      });

      zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('bg-green-100');
        const dragEvent = e as DragEvent;
        const topic = dragEvent.dataTransfer?.getData('text/plain');
        const div = document.createElement('div');
        div.textContent = topic ?? '';
        div.className = 'p-2 bg-yellow-100 rounded';
        const weekContainer = zone.querySelector("div[id^='week-']");
        weekContainer?.appendChild(div);
      });
    });
  }, []);

  return (
    <>
    <div className="flex flex-row h-screen p-4 space-x-4 bg-gray-100">
      {/* Topics Sidebar */}
      <div className="w-1/4 p-4 bg-white rounded shadow">
        <h2 className="text-lg font-bold mb-2">Available Topics</h2>
        <div id="topic-list" className="space-y-2">
          {['Kinematics', 'Dynamics', 'Circular Motion'].map((topic) => (
            <div
              key={topic}
              draggable="true"
              data-topic={topic}
              className="p-2 bg-blue-200 rounded cursor-move"
            >
              {topic}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 p-4 bg-white rounded shadow overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Weekly Timeline</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((week) => (
            <div
              key={week}
              className="p-4 bg-gray-200 rounded dropzone"
              data-week={week}
            >
              <h3 className="font-semibold mb-2">Week {week}</h3>
              <div className="min-h-[50px] space-y-2" id={`week-${week}`} />
            </div>
          ))}
        </div>
      </div>
      
    </div>
    <TopicFlow/>
    </>
  );
}
