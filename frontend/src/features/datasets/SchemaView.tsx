import { Icon } from '../../components/Icon'

export function SchemaView({ columns }: { columns: string[] }) {
  return (
    <div className="min-h-0 flex-1 overflow-auto px-4 py-6 md:px-8">
      <div className="max-w-2xl overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-sunken text-left text-xs text-muted">
            <tr>
              <th className="w-12 px-4 py-2.5 font-medium">#</th>
              <th className="px-4 py-2.5 font-medium">Column</th>
              <th className="px-4 py-2.5 font-medium">Stored as</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line font-mono text-[13px]">
            <tr className="text-muted">
              <td className="px-4 py-2.5 text-faint">0</td>
              <td className="px-4 py-2.5">
                <span className="inline-flex items-center gap-2">
                  <Icon name="key" className="size-3.5 text-accent" />
                  _id
                </span>
              </td>
              <td className="px-4 py-2.5">
                <TypeTag>integer</TypeTag> <span className="ml-1 font-sans text-xs">primary key, set by the system</span>
              </td>
            </tr>
            {columns.map((column, i) => (
              <tr key={column} className="rise" style={{ animationDelay: `${i * 25}ms` }}>
                <td className="px-4 py-2.5 text-faint">{i + 1}</td>
                <td className="px-4 py-2.5">{column}</td>
                <td className="px-4 py-2.5">
                  <TypeTag>text</TypeTag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TypeTag({ children }: { children: string }) {
  return <span className="rounded border border-line bg-paper px-1.5 py-0.5 text-[11px] text-muted uppercase">{children}</span>
}
