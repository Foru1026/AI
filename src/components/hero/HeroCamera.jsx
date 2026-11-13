import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { cameraFlight, coreTargetY } from "../../lib/timeline.js";

export default function HeroCamera({ scroll }) {
  const { camera, gl, size } = useThree();
  const timer = useRef(0.1);

  useEffect(
    () => () => {
      delete gl.domElement.dataset.heroCamera;
      delete gl.domElement.dataset.heroProgress;
    },
    [gl],
  );

  useFrame((_, delta) => {
    const p = cameraFlight(scroll.current, coreTargetY(size.height));
    camera.position.set(p.x, p.y, p.z);
    camera.updateMatrixWorld();
    timer.current += delta;
    if (timer.current >= 0.1) {
      timer.current = 0;
      gl.domElement.dataset.heroCamera = camera.position
        .toArray()
        .map((v) => v.toFixed(4))
        .join(",");
      gl.domElement.dataset.heroProgress = scroll.current.toFixed(4);
    }
  }, -1);

  return null;
}
