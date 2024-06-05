import { RiLoader5Fill } from 'react-icons/ri'

export default function Loader() {
  return (
    <div className="flex items-center justify-center h-full">
      <RiLoader5Fill className="size-7 text-primary animate-spin" />
    </div>
  )
}
