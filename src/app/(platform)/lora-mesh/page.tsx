import MeshStatus from "../communication/components/mesh-status";

export default function LoraMeshPage() {
  return (
    <div className="access-screen com-screen">
      <div className="com-mesh-wrap">
        <MeshStatus />
      </div>
    </div>
  );
}
