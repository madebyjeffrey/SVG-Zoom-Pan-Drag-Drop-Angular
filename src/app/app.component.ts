import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

enum DragOperationTypes {
  Shape = 0,
  Grid = 1
}


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {

  @ViewChild('svgGrid') svgGrid: ElementRef<SVGSVGElement>
  public dragOperationTypes: typeof DragOperationTypes = DragOperationTypes;

  title = 'svg-test';

  selectedElement: SVGElement;
  lastMouseEvent: MouseEvent;
  dragOperationType: DragOperationTypes;

  offsetX = 0;
  offsetY = 0;

  currentViewboxToSvgRatio = 1;

  svgTop;
  svgLeft;
  svgRight;
  svgBottom;

  pointerMoveInterval;

  ngAfterViewInit(): void{

    let screenCTM = this.svgGrid.nativeElement.getScreenCTM();
    //console.log("screenCTM", screenCTM)

    this.svgLeft = screenCTM.e;
    this.svgTop = screenCTM.f;
    this.svgRight = this.svgLeft + this.svgGrid.nativeElement.clientWidth;
    this.svgBottom = this.svgTop + this.svgGrid.nativeElement.clientHeight;

    //console.log("svgLeft", this.svgLeft, "svgTop", this.svgTop, "svgRight", this.svgRight, "svgBottom", this.svgBottom)
  }


  mouseWheel(wheelEvent: WheelEvent) {
    const zoomScale = 1.1;

    wheelEvent.stopPropagation();
    let zoomX = wheelEvent.offsetX;
    let zoomY = wheelEvent.offsetY;

    console.log("zoomX", zoomX, "zoomY", zoomY)

    let zoomDirection = wheelEvent.deltaY;

    let scaledViewboxWidth
    let scaledViewboxHeight
    let scaledViewboxX
    let scaledViewboxY

    let zoomLeftFraction = zoomX / this.svgGrid.nativeElement.clientWidth;
    let zoomTopFraction = zoomY / this.svgGrid.nativeElement.clientHeight;

    console.log("zoomLeftFraction", zoomLeftFraction, "zoomTopFraction", zoomTopFraction)



    //console.log("deltaY", deltaY)

    let [viewboxX, viewboxY, viewboxWidth, viewboxHeight] = this.svgGrid.nativeElement.getAttribute('viewBox')
      .split(' ')
      .map(s => parseFloat(s))

    if(zoomDirection > 0) {
      scaledViewboxWidth = viewboxWidth / zoomScale;
      scaledViewboxHeight = viewboxHeight / zoomScale;

      scaledViewboxX = viewboxX + ((viewboxWidth - scaledViewboxWidth) * zoomLeftFraction)
      scaledViewboxY = viewboxY + ((viewboxHeight - scaledViewboxHeight) * zoomTopFraction)
    }
    else {
      scaledViewboxWidth = viewboxWidth * zoomScale;
      scaledViewboxHeight = viewboxHeight * zoomScale;

      scaledViewboxX = viewboxX - ((scaledViewboxWidth - viewboxWidth) * zoomLeftFraction)
      scaledViewboxY = viewboxY - ((scaledViewboxHeight - viewboxHeight) * zoomTopFraction)
    }

    const scaledViewbox = [scaledViewboxX, scaledViewboxY, scaledViewboxWidth, scaledViewboxHeight]
                            .map(s => s.toFixed(2))
                            .join(' ')
    this.svgGrid.nativeElement.setAttribute('viewBox',scaledViewbox )

    this.currentViewboxToSvgRatio = scaledViewboxWidth / this.svgGrid.nativeElement.clientWidth;

    //[viewboxX, viewboxY, viewboxWidth, viewboxHeight]
    //console.log("viewboxX", viewboxX, "viewboxY", viewboxY,"viewboxWidth", viewboxWidth,"viewboxHeight", viewboxHeight,)

  }

  pointerDown(event: MouseEvent, selectedElement: SVGElement, dragOperationType: DragOperationTypes) {
    console.log("event", event)
    console.log("selectedElement", selectedElement)
    console.log("dragOperationType", dragOperationType)

    this.lastMouseEvent = event;
    this.selectedElement = selectedElement;
    this.dragOperationType = dragOperationType;

    event.stopPropagation();
  }


  pointerMove(event) {
    if(this.selectedElement) {

      let gutter = 10;
      let step = 20;
      let intervalTime = 100

      let mouseDeltaX = event.clientX - this.lastMouseEvent.clientX;
      let mouseDeltaY = event.clientY - this.lastMouseEvent.clientY;

      if(event.clientX > (this.svgRight - gutter)) {
        clearInterval(this.pointerMoveInterval)

        switch(this.dragOperationType) {
          case DragOperationTypes.Shape:
            console.log("this.svgRight")
            this.pointerMoveInterval = setInterval(() => {
              this.dragShape(this.selectedElement, step, 0)
              this.dragGrid(-step, 0)
            }, intervalTime)

          break;
        }


      }
      else if(event.clientY > (this.svgBottom - gutter)) {
        clearInterval(this.pointerMoveInterval)

        switch(this.dragOperationType) {
          case DragOperationTypes.Shape:

            this.pointerMoveInterval = setInterval(() => {
              this.dragShape(this.selectedElement, 0, step)
              this.dragGrid(0, -step)
            }, intervalTime)

          break;
        }
      }
      else if(event.clientX < (this.svgLeft + gutter)) {
        clearInterval(this.pointerMoveInterval)

        switch(this.dragOperationType) {
          case DragOperationTypes.Shape:

            this.pointerMoveInterval = setInterval(() => {
              this.dragShape(this.selectedElement, -step, 0)
              this.dragGrid(step, 0)
            }, intervalTime)

          break;
        }
      }
      else if(event.clientY < (this.svgTop + gutter)) {
        clearInterval(this.pointerMoveInterval)

        switch(this.dragOperationType) {
          case DragOperationTypes.Shape:

            this.pointerMoveInterval = setInterval(() => {
              this.dragShape(this.selectedElement, 0, -step)
              this.dragGrid(0, step)
            }, intervalTime)

          break;
        }
      }


      else {

        clearInterval(this.pointerMoveInterval)

        switch(this.dragOperationType) {
          case DragOperationTypes.Shape:

            this.dragShape(this.selectedElement, mouseDeltaX, mouseDeltaY);
          break;
          case DragOperationTypes.Grid:

            this.dragGrid(mouseDeltaX, mouseDeltaY);

          break;

        }
      }

      this.lastMouseEvent = event;
    }
    event.preventDefault();
    event.stopPropagation();
  }


  dragShape(selectedElement: SVGElement, mouseDeltaX: number, mouseDeltaY: number){
    console.log("dragShape")
    let currentX = parseFloat(selectedElement.getAttributeNS(null, "x"));
    let currentY = parseFloat(selectedElement.getAttributeNS(null, "y"));

    currentX += mouseDeltaX * this.currentViewboxToSvgRatio;
    currentY += mouseDeltaY * this.currentViewboxToSvgRatio;

    selectedElement.setAttributeNS(null, 'x', currentX.toString())
    selectedElement.setAttributeNS(null, 'y', currentY.toString())
  }


  dragGrid(mouseDeltaX: number, mouseDeltaY: number){

    let [viewboxX, viewboxY, viewboxWidth, viewboxHeight] = this.svgGrid.nativeElement.getAttribute("viewBox")
      .split(' ')
      .map(s => parseFloat(s))

    viewboxX -= mouseDeltaX * this.currentViewboxToSvgRatio;
    viewboxY -= mouseDeltaY * this.currentViewboxToSvgRatio;

    let scaledViewbox = [viewboxX, viewboxY, viewboxWidth, viewboxHeight]
      .map(s => s.toFixed(2))
      .join(' ')

    this.svgGrid.nativeElement.setAttribute('viewBox', scaledViewbox)
  }


  // pointerDown(event) {
  //   console.log("pointerDown", event)
  //   if(event.target.classList.contains("draggable")) {
  //     this.selectedElement = event.target;

  //     let targetPositionX = this.selectedElement.getAttributeNS(null, 'x')
  //     let targetPositionY = this.selectedElement.getAttributeNS(null, 'y')

  //     let mousePositionX = event.clientX;
  //     let mousePositionY = event.clientY;

  //     let ctm = this.svgGrid.nativeElement.getScreenCTM();
  //     mousePositionX -= ctm.e;
  //     mousePositionY -= ctm.f;

  //     this.offsetX = mousePositionX - targetPositionX;
  //     this.offsetY = mousePositionY - targetPositionY;

  //     console.log("this.offsetX", this.offsetX);
  //     console.log("this.offsetY", this.offsetY);

  //   }

  // }

  // pointerMove(event) {
  //   if(this.selectedElement) {
  //     //console.log("pointerMove", event)

  //     let mousePositionX = event.clientX;
  //     let mousePositionY = event.clientY;

  //     console.log("mousePositionX", mousePositionX);
  //     console.log("mousePositionY", mousePositionY);


  //     let ctm = this.svgGrid.nativeElement.getScreenCTM();
  //     mousePositionX -= ctm.e;
  //     mousePositionY -= ctm.f;

  //     mousePositionX -= this.offsetX;
  //     mousePositionY -= this.offsetY;


  //     this.selectedElement.setAttributeNS(null, 'x', mousePositionX);
  //     this.selectedElement.setAttributeNS(null, 'y', mousePositionY);

  //     console.log("mousePositionX", mousePositionX)
  //     console.log("mousePositionY", mousePositionY)

  //   }
  //   event.preventDefault();
  // }

  pointerUp(event) {
    console.log("pointerUp", event)
    this.selectedElement = null;

    if(this.pointerMoveInterval) {
      clearInterval(this.pointerMoveInterval)
    }
  }


}
