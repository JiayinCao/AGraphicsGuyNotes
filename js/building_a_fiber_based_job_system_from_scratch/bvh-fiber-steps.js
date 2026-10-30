(() => {
  const steps = [
    {
      title: 'Create the WaitGroup',
      description: 'The current job creates children_done with a counter of 2 on its fiber stack. The object is shown separately so its state is visible.',
      currentDetail: 'Executing',
      counter: 2, waiters: 'Empty', left: 'Not scheduled', right: 'Not scheduled',
      leftAssigned: false, rightAssigned: false, groupAlive: true, completed: [],
      scheduler: 'Paused', pending: 'Empty', ready: 'Empty', active: ['original', 'group'], running: ['original'], edges: []
    },
    {
      title: 'Enqueue two incoming jobs',
      description: 'The scheduling calls enqueue the left and right subtree jobs. They do not execute the builds or assign worker fibers yet.',
      left: 'Not scheduled', right: 'Not scheduled',
      pending: 'Left subtree job + right subtree job', active: ['original', 'pending'], running: ['original'], edges: []
    },
    {
      title: 'Register and yield',
      description: 'Wait() finds that the counter is not zero and registers Worker Fiber A\'s context in the WaitGroup. It then pauses and switches to the background fiber, retaining its stack while the scheduler runs other work.',
      waiters: 'Worker Fiber A',
      scheduler: 'Selecting available jobs',
      active: ['group', 'scheduler'], running: ['scheduler'], edges: ['yield']
    },
    {
      title: 'Switch to Worker Fiber B',
      description: 'The background fiber dispatches the left subtree job and switches to Worker Fiber B. That background fiber is no longer executing. The right subtree job remains queued.',
      left: 'Building the left subtree', right: 'Not scheduled', pending: 'Right subtree job', scheduler: 'Paused',
      leftAssigned: true,
      active: ['left', 'pending'], running: ['left'], edges: ['dispatch-left']
    },
    {
      title: 'Start Worker Fiber C on another thread',
      description: 'Another background fiber, on a different worker thread, dispatches the right subtree job and switches to Worker Fiber C. B and C can now run concurrently; neither background fiber executes while its worker fiber runs.',
      right: 'Building the right subtree', pending: 'Empty', scheduler: 'Paused',
      rightAssigned: true,
      active: ['left', 'right', 'pending'], running: ['left', 'right'], edges: []
    },
    {
      title: 'One child signals completion',
      description: 'Worker Fiber C finishes the right subtree first and calls Signal(). The counter drops from 2 to 1. Worker Fiber B continues building the left subtree, while Worker Fiber A remains in the WaitGroup.',
      right: '✓ Completed', counter: 1, scheduler: 'Paused', completed: ['right'],
      active: ['group'], running: ['left'], edges: []
    },
    {
      title: 'The final signal makes waiters ready',
      description: 'Worker Fiber B finishes the left subtree and calls Signal(), reducing the counter to zero. All waiting contexts move from the WaitGroup to the ready job context pool. B returns to the background scheduling loop; A is ready but not executing yet.',
      left: '✓ Completed', counter: 0, waiters: 'Empty', ready: 'Worker Fiber A', scheduler: 'Scheduling other work', completed: ['left', 'right'],
      active: ['group', 'ready'], running: ['scheduler'], edges: ['return-left']
    },
    {
      title: 'Resume the waiting job',
      description: 'The scheduler selects the ready context and switches to its existing worker fiber. Wait() checks the counter again, sees zero, and returns. Both child builds are complete.',
      ready: 'Empty', scheduler: 'Paused; switched to A',
      active: ['original', 'ready'], running: ['original'], edges: ['resume']
    },
    {
      title: 'Finish the BVH job and return',
      description: 'The BVH job on Worker Fiber A returns. Its local WaitGroup goes out of scope, and control switches back to the background fiber to continue scheduling.',
      groupAlive: false, waiters: '-', scheduler: 'Scheduling other work', completed: ['original', 'left', 'right'],
      active: ['scheduler'], running: ['scheduler'], edges: ['return-original']
    }
  ];
  // Every slider position is a complete snapshot, including when scrubbing backward.
  const snapshots = steps.map((step, index) => Object.assign({}, ...steps.slice(0, index + 1)));
  const waitStatuses = [
    'Not reached yet', 'Not reached yet', 'Registered and paused',
    'Paused until both children finish', 'Paused until both children finish',
    'Paused; one child remains', 'Ready, not executing yet', 'Executing again; Wait() returns', 'Wait() completed'
  ];
  document.querySelectorAll('[data-bvh-steps]').forEach(figure => {
    if (figure.dataset.initialized) return;
    figure.dataset.initialized = 'true';
    const slider = figure.querySelector('input[type="range"]');
    const back = figure.querySelector('[data-back]');
    const next = figure.querySelector('[data-next]');
    const fields = { waiters: 'waiters', left: 'left', right: 'right', scheduler: 'scheduler', pending: 'pending', ready: 'ready' };
    const render = () => {
      const index = Number(slider.value);
      const state = snapshots[index];
      // Compare with the preceding execution step, even when scrubbing backward.
      const previous = snapshots[index - 1];
      figure.querySelector('[data-waiters-label]').style.display = state.groupAlive ? '' : 'none';
      figure.querySelector('[data-waiters]').style.display = state.groupAlive ? '' : 'none';
      figure.querySelector('[data-title]').textContent = `${index + 1} / ${steps.length} · ${state.title}`;
      figure.querySelector('[data-description]').textContent = state.description;
      figure.querySelector('[data-svg-description]').textContent = state.description;
      figure.querySelector('[data-counter]').textContent = state.groupAlive ? `Counter: ${state.counter}` : 'Destroyed';
      figure.querySelector('[data-group-note]').textContent = state.groupAlive
        ? 'children_done · on the current fiber stack' : 'children_done · out of scope';
      figure.querySelector('[data-wait-status]').textContent = waitStatuses[index];
      Object.entries(fields).forEach(([key, selector]) => { figure.querySelector(`[data-${selector}]`).textContent = state[key]; });
      figure.querySelector('[data-right-note]').style.display = state.running.includes('right') ? '' : 'none';
      figure.querySelectorAll('[data-completion-note]').forEach(node => {
        node.style.display = state.completed.includes(node.dataset.completionNote) ? '' : 'none';
      });
      figure.querySelectorAll('[data-assignment]').forEach(node => {
        const name = node.dataset.assignment;
        const finishedEarlier = previous && previous.completed.includes(name);
        node.style.display = state[`${name}Assigned`] && !finishedEarlier ? '' : 'none';
      });
      figure.querySelectorAll('[data-region]').forEach(node => {
        node.classList.toggle('active', state.active.includes(node.dataset.region));
        node.classList.toggle('running', state.running.includes(node.dataset.region));
        node.classList.toggle('completed', state.completed.includes(node.dataset.region));
      });
      figure.querySelector('[data-finish-status]').textContent = state.completed.includes('original')
        ? '✓ Completed; control returned' : 'Return to the background fiber';
      figure.querySelectorAll('[data-job-step]').forEach(node => node.classList.toggle('active', node.dataset.jobStep.split(' ').includes(String(index))));
      figure.querySelectorAll('[data-edge]').forEach(node => node.classList.toggle('active', state.edges.includes(node.dataset.edge)));
      figure.querySelectorAll('.changed').forEach(node => node.classList.remove('changed'));
      const mark = selector => figure.querySelectorAll(selector).forEach(node => node.classList.add('changed'));
      Object.entries(fields).forEach(([key, selector]) => {
        if (previous && state[key] !== previous[key]) mark(`[data-${selector}]`);
      });
      if (!previous || state.counter !== previous.counter || state.groupAlive !== previous.groupAlive) mark('[data-counter]');
      if (previous && state.groupAlive !== previous.groupAlive) mark('[data-group-note]');
      if (previous && waitStatuses[index] !== waitStatuses[index - 1]) mark('[data-wait-status]');
      if (previous && state.completed.includes('original') !== previous.completed.includes('original')) mark('[data-finish-status]');
      ['left', 'right'].forEach(name => {
        if (previous && state[`${name}Assigned`] && !previous[`${name}Assigned`]) mark(`[data-assignment="${name}"] text`);
      });
      if (previous && state.running.includes('right') && !previous.running.includes('right')) mark('[data-right-note]');
      ['left', 'right'].forEach(name => {
        if (previous && state.completed.includes(name) && !previous.completed.includes(name)) mark(`[data-completion-note="${name}"]`);
      });
      ['group', 'pending', 'ready'].forEach(name => {
        const node = figure.querySelector(`[data-region="${name}"]`);
        node.classList.toggle('changed', Boolean(node.querySelector('text.changed')));
      });
      slider.setAttribute('aria-valuetext', `${index + 1} of ${steps.length}: ${state.title}`);
      back.disabled = index === 0;
      next.disabled = index === steps.length - 1;
    };
    slider.addEventListener('input', render);
    back.addEventListener('click', () => { slider.stepDown(); render(); });
    next.addEventListener('click', () => { slider.stepUp(); render(); });
    let hovered = false;
    figure.addEventListener('pointerenter', event => { hovered = event.pointerType !== 'touch'; });
    figure.addEventListener('pointerleave', () => { hovered = false; });
    window.addEventListener('blur', () => { hovered = false; });
    document.addEventListener('keydown', event => {
      if (!hovered || event.defaultPrevented || event.isComposing ||
          event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
          !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      // Keep text editing and the focused range input's native key handling.
      const target = event.target;
      if (target instanceof Element &&
          (target.closest('input, textarea, select') || target.isContentEditable)) return;
      event.preventDefault();
      if (event.key === 'ArrowLeft') slider.stepDown();
      else slider.stepUp();
      render();
    });
    figure.querySelector('.bvh-controls').hidden = false;
    render();
  });
})();
