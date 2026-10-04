async function auditCity() {
  const resp = await fetch('http://127.0.0.1:30250/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: `
local folder = workspace:FindFirstChild("City_SanAndreas_Compact")
if not folder then return { error = "City folder not found" } end

local summary = {}
for _, child in ipairs(folder:GetChildren()) do
    local partCount = 0
    for _, desc in ipairs(child:GetDescendants()) do
        if desc:IsA("BasePart") then
            partCount = partCount + 1
        end
    end
    summary[child.Name] = {
        className = child.ClassName,
        partCount = partCount,
        subItems = child:IsA("Folder") and #child:GetChildren() or 0
    }
end

return {
    totalChildren = #folder:GetChildren(),
    breakdown = summary
}
      `,
      actionName: "Audit City Structure",
      isQuery: true
    })
  });

  const res = await resp.json();
  console.log("Roblox Studio City Audit:", JSON.stringify(res.data, null, 2));
}

auditCity().catch(console.error);
