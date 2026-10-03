import GatewayStatus from "../communication/components/gateway-status";

export default function GatewaysPage() {
  return (
    <div className="access-screen com-screen">
      <div className="com-mesh-wrap">
        <GatewayStatus />
      </div>
    </div>
  );
}
