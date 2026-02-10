// markers.js — Numbered annotation dots placed at element positions.

var AgentationMarkers = (function() {
  var markers = {};  // annotationId -> DOM element
  var visible = true;
  var onMarkerClick = null;

  function createMarker(annotation, index) {
    if (markers[annotation.id]) removeMarker(annotation.id);

    var marker = document.createElement("div");
    marker.className = "ag-marker";
    if (annotation.isFixed) marker.classList.add("ag-fixed");
    marker.setAttribute("data-agentation-marker", "");
    marker.setAttribute("data-annotation-id", annotation.id);
    marker.textContent = String(index + 1);

    // Position at annotation coordinates
    marker.style.left = (annotation.x - 12) + "px";
    marker.style.top = (annotation.y - 12) + "px";

    // Apply color
    if (annotation.color) {
      marker.style.background = annotation.color;
    }

    marker.addEventListener("click", function(e) {
      e.stopPropagation();
      e.preventDefault();
      if (onMarkerClick) onMarkerClick(annotation.id);
    });

    if (!visible) marker.style.display = "none";

    document.body.appendChild(marker);
    markers[annotation.id] = marker;
  }

  function updateMarkers(annotations, color) {
    clearMarkers();
    annotations.forEach(function(annotation, index) {
      if (color) annotation.color = color;
      createMarker(annotation, index);
    });
  }

  function setMarkersVisible(show) {
    visible = show;
    Object.keys(markers).forEach(function(id) {
      markers[id].style.display = show ? "" : "none";
    });
  }

  function removeMarker(annotationId) {
    var marker = markers[annotationId];
    if (marker) {
      marker.classList.add("ag-marker-exit");
      AgentationFreeze.originalSetTimeout(function() {
        if (marker.parentNode) marker.parentNode.removeChild(marker);
      }, 200);
      delete markers[annotationId];
    }
  }

  function clearMarkers() {
    Object.keys(markers).forEach(function(id) {
      var marker = markers[id];
      if (marker && marker.parentNode) marker.parentNode.removeChild(marker);
    });
    markers = {};
  }

  function setOnMarkerClick(callback) {
    onMarkerClick = callback;
  }

  function destroy() {
    clearMarkers();
    onMarkerClick = null;
  }

  return {
    createMarker: createMarker,
    updateMarkers: updateMarkers,
    setMarkersVisible: setMarkersVisible,
    removeMarker: removeMarker,
    clearMarkers: clearMarkers,
    setOnMarkerClick: setOnMarkerClick,
    destroy: destroy
  };
})();
