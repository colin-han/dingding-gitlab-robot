const status = {};

exports.updateState = function updateState (message) {
  if (message.object_attributes.status !== 'failed' &&
      message.object_attributes.status !== 'success') {
    return false;
  }

  const projectId = message.project.path_with_namespace;
  const success = message.object_attributes.status !== 'failed';
  if (status[projectId] !== success) {
    status[projectId] = success;
    return true;
  }

  return false;
};