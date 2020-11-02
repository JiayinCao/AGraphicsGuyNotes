// Adapted from: https://github.com/jotform/before-after.js/

// The MIT License(MIT)

// Copyright(c) 2015 JotForm

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files(the "Software"), to deal
//     in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and / or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

(function($) {
  function drags(dragElement, resizeElement, container) {
    
    // Initialize the dragging event on mousedown.
    dragElement.on('mousedown.ba-events touchstart.ba-events', function(e) {
      
      dragElement.addClass('ba-draggable');
      resizeElement.addClass('ba-resizable');
      
      // Check if it's a mouse or touch event and pass along the correct value
      var startX = (e.pageX) ? e.pageX : e.originalEvent.touches[0].pageX;
      
      // Get the initial position
      var dragWidth = dragElement.outerWidth(),
          posX = dragElement.offset().left + dragWidth - startX,
          containerOffset = container.offset().left,
          containerWidth = container.outerWidth();
   
      // Set limits
      minLeft = containerOffset + 10;
      maxLeft = containerOffset + containerWidth - dragWidth - 10;
      
      // Calculate the dragging distance on mousemove.
      dragElement.parents().on("mousemove.ba-events touchmove.ba-events", function(e) {
        
        // Check if it's a mouse or touch event and pass along the correct value
        var moveX = (e.pageX) ? e.pageX : e.originalEvent.touches[0].pageX;
        
        leftValue = moveX + posX - dragWidth;
        
        // Prevent going off limits
        if ( leftValue < minLeft) {
          leftValue = minLeft;
        } else if (leftValue > maxLeft) {
          leftValue = maxLeft;
        }
        
        // Translate the handle's left value to masked divs width.
        widthValue = (leftValue + dragWidth/2 - containerOffset)*100/containerWidth+'%';
        
        // Set the new values for the slider and the handle. 
        $('.ba-draggable').css('left', widthValue);
        $('.ba-resizable').css('width', widthValue);
      // Bind mouseup events to stop dragging.
      }).on('mouseup.ba-events touchend.ba-events touchcancel.ba-events', function(){
        dragElement.removeClass('ba-draggable');
        resizeElement.removeClass('ba-resizable');
        // Unbind all events for performance
        $(this).off('.ba-events'); 
      });
      e.preventDefault();
    });
  }

  // Define plugin
  $.fn.beforeAfter = function() {
    var cur = this;
    // Adjust the slider
    var width = cur.width()+'px';
    cur.find('.resize img').css('width', width);
    // Bind dragging events
    drags(cur.find('.handle'), cur.find('.resize'), cur);

    // Update sliders on resize. 
    // Because we all do this: i.imgur.com/YkbaV.gif
    $(window).resize(function(){
      var width = cur.width()+'px';
      cur.find('.resize img').css('width', width);
    });
  }
}(jQuery));
