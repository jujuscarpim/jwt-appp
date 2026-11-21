import Registry from '../registry';
export default async function Section({params}:{params:Promise<{section:string}>}){const {section}=await params;return <Registry section={section}/>}
