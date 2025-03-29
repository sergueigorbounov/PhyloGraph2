import { api } from '../api/api';
import { toast } from 'react-hot-toast';
import { useLog } from '../hooks/useLog';
import { Download } from 'lucide-react';

export default function RDFDownloader() {
  const { addLog } = useLog();

  const handleDownload = async () => {
    try {
      const res = await api.get('/rdf', {
        headers: { Accept: 'text/turtle' },
        responseType: 'text',
      });

      const blob = new Blob([res.data], { type: 'text/turtle' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'phylograph.ttl';
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('✅ RDF exported as Turtle');
      addLog('📤 Exported RDF as Turtle file (phylograph.ttl)');
    } catch (error) {
      console.error('RDF export failed:', error);
      toast.error('❌ RDF export failed');
      addLog('⚠️ RDF export failed: ' + error.message);
    }
  };

  return (
    <button
  onClick={handleDownload}
  className="px-4 py-2 text-sm border border-[#626262] rounded bg-[#222] text-[#aeaeae] hover:bg-[#333] flex items-center gap-2"
>
  <Download size={25} /> Export RDF (Turtle)
</button>

  );
}
