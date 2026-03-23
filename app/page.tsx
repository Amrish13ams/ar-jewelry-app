'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Menu, Loader2, SwitchCamera, ChevronLeft } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import Image from 'next/image'
import companyLogo from '../WhatsApp Image 2025-08-21 at 6.30.31 PM.png'
import frontImage from '../front.jpeg'
import ringImage from '../ring.png'
import bangleImage from '../bangle.png'
import earringImage from '../earing1.png'
import mookuthiImage from '../mookuthi.png'
import nethichuttiImage from '../nethichuttu.png'

const DEFAULT_NECKLACE = '/necklace.png'
const REMOTE_FALLBACK = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/necless-removebg-preview-eKz2jodGH8N7T3A6C0R7P8ArJP6J6b.png'

// Filter out harmless MediaPipe info logs that trigger Next.js error overlays
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Created TensorFlow Lite XNNPACK delegate')) {
      return; // Ignore this specific log
    }
    originalError(...args);
  };
}

// Move these constants outside the component to fix React Hook dependencies
const productCategories = [
  { id: 'necklace', label: 'Necklace' },
  { id: 'earring', label: 'Earring' },
  { id: 'ring', label: 'Ring' },
  { id: 'nethichutti', label: 'Nethichutti' },
  { id: 'mookuthi', label: 'Mookuthi' },
  { id: 'bangle', label: 'Bangle' },
]

const DUMMY_PRODUCTS: Record<string, { id: string, name: string, src: string, weight?: number }[]> = {
  necklace: [
    { id: 'n1', name: 'Classic Silver', src: DEFAULT_NECKLACE, weight: 15.5 },
  ],
  earring: [
    { id: 'e1', name: 'Silver Hoops', src: earringImage.src, weight: 4.3 },
  ],
  ring: [
    { id: 'r1', name: 'Diamond Ring', src: ringImage.src, weight: 3.1 },
  ],
  nethichutti: [
    { id: 'nc1', name: 'Bridal Nethichutti', src: nethichuttiImage.src, weight: 22.0 },
  ],
  mookuthi: [
    { id: 'm1', name: 'Gold Mookuthi', src: mookuthiImage.src, weight: 1.25 },
  ],
  bangle: [
    { id: 'b1', name: 'Kundan Bangle', src: bangleImage.src, weight: 35.5 },
  ],
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const necklaceImageRef = useRef<HTMLImageElement | null>(null)
  const faceDetectionRef = useRef<any>(null)
  const handDetectionRef = useRef<any>(null)
  const poseDetectionRef = useRef<any>(null)
  const smoothedBangleLeftRef = useRef<{x: number, y: number, width: number, angle: number} | null>(null)
  const smoothedBangleRightRef = useRef<{x: number, y: number, width: number, angle: number} | null>(null)
  const [permissionState, setPermissionState] = useState<'pending' | 'granted' | 'denied'>('pending')
  const facingModeRef = useRef<'user' | 'environment'>('user')
  const [isSwitching, setIsSwitching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(DEFAULT_NECKLACE)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [products, setProducts] = useState<Record<string, { id: string, name: string, src: string, weight?: number }[]>>({})
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true)
  const [appState, setAppState] = useState<'splash' | 'options' | 'catalog' | 'detail' | 'ar'>('splash')
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([])
  const [activeCameraId, setActiveCameraId] = useState<string>('')
  const [showCameraOptions, setShowCameraOptions] = useState(false)

  useEffect(() => {
    if (appState === 'splash') {
      const timer = setTimeout(() => setAppState('options'), 3000)
      return () => clearTimeout(timer)
    }
  }, [appState])

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoadingCatalog(true)
      try {
        // Add a 5-second timeout so it doesn't hang if the DB is unreachable
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch('/api/products', { signal: controller.signal })
        clearTimeout(timeoutId)

        if (!response.ok) {
          console.warn('Failed to fetch products, using dummy data')
          setProducts(DUMMY_PRODUCTS)
          setIsLoadingCatalog(false)
          return
        }
        const data = await response.json()
        
        // If the database fails to connect or is empty, use the dummy fallback data
        if (!data || data.error || !Array.isArray(data) || data.length === 0) {
          setProducts(DUMMY_PRODUCTS)
          setIsLoadingCatalog(false)
          return
        }

        const groupedProducts: Record<string, { id: string, name: string, src: string, weight?: number }[]> = {}
        let hasData = false

        data.forEach((item: any) => {
          if (item.category) {
            if (!groupedProducts[item.category]) {
              groupedProducts[item.category] = []
            }
            
            let imgSrc = item.image || DEFAULT_NECKLACE
            // The database currently has the remote fallback necklace URL for all products
            if (imgSrc === REMOTE_FALLBACK || imgSrc === DEFAULT_NECKLACE) {
              if (item.category === 'ring') imgSrc = ringImage.src
              else if (item.category === 'bangle') imgSrc = bangleImage.src
              else if (item.category === 'earring') imgSrc = earringImage.src
              else if (item.category === 'nethichutti') imgSrc = nethichuttiImage.src
              else if (item.category === 'mookuthi') imgSrc = mookuthiImage.src
            }

            groupedProducts[item.category].push({ id: item.productid || `temp-${Math.random()}`, name: item.name || 'Unknown', src: imgSrc, weight: item.weight })
            hasData = true
          }
        })
        setProducts(hasData ? groupedProducts : DUMMY_PRODUCTS)
      } catch (error) {
        console.error('Error fetching products:', error)
        // Use dummy fallback data on network error
        setProducts(DUMMY_PRODUCTS)
      } finally {
        setIsLoadingCatalog(false)
      }
    }
    fetchProducts()
  }, [])

  const startStream = useCallback(async (modeOrDeviceId: string) => {
    try {
      const oldStream = videoRef.current?.srcObject as MediaStream | null;
      const isFacingMode = modeOrDeviceId === 'user' || modeOrDeviceId === 'environment';
      
      const videoConstraints = isFacingMode 
        ? { facingMode: modeOrDeviceId, width: { ideal: 3840 }, height: { ideal: 2160 } }
        : { deviceId: { exact: modeOrDeviceId }, width: { ideal: 3840 }, height: { ideal: 2160 } };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await new Promise<void>((resolve) => {
          if (!videoRef.current) return resolve()
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(console.error)
            if (oldStream) {
              oldStream.getTracks().forEach((track) => track.stop())
            }
            setPermissionState('granted')
            resolve()
          }
        })
      }
    } catch (error) {
      console.error('Error switching camera:', error)
      throw error
    }
  }, [])

  useEffect(() => {
    // Use getAttribute to avoid absolute/relative URL mismatch bugs
    if (necklaceImageRef.current && necklaceImageRef.current.getAttribute('src') !== selectedProduct) {
      necklaceImageRef.current.setAttribute('src', selectedProduct)
    }
  }, [selectedProduct])

  useEffect(() => {
    if (appState !== 'ar') return;

    const initAR = async () => {
      try {
        // Check camera permissions first
        try {
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
          if (permission.state === 'denied') {
            setPermissionState('denied')
            return
          }
        } catch (err) {
          // Fallback if permissions API is not supported
          console.log('[v0] Permissions API not available, proceeding with request')
        }

        // Load MediaPipe FaceMesh
        const faceMeshModule = await import('@mediapipe/tasks-vision')
        const { FaceLandmarker, HandLandmarker, PoseLandmarker, FilesetResolver } = faceMeshModule

        const vision = await FilesetResolver.forVisionTasks(
          '/mediapipe/wasm'
        )

        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              '/mediapipe/models/face_landmarker.task',
          },
          numFaces: 1,
          runningMode: 'VIDEO',
        })

        let handLandmarker;
        try {
          handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: '/mediapipe/models/hand_landmarker.task',
            },
            numHands: 2,
            runningMode: 'VIDEO',
          })
        } catch (e) {
          console.warn("Local hand landmarker missing, falling back to remote", e)
          handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            },
            numHands: 2,
            runningMode: 'VIDEO',
          })
        }
        
        let poseLandmarker;
        try {
          poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: '/mediapipe/models/pose_landmarker.task',
            },
            runningMode: 'VIDEO',
          })
        } catch (e) {
          console.warn("Local pose landmarker missing, falling back to remote", e)
          poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            },
            runningMode: 'VIDEO',
          })
        }

        faceDetectionRef.current = faceLandmarker
        handDetectionRef.current = handLandmarker
        poseDetectionRef.current = poseLandmarker

        // Initialize video stream
        await startStream(facingModeRef.current)

        // Fetch available cameras after permission is granted
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          const videoDevices = devices.filter(d => d.kind === 'videoinput')
          setCameras(videoDevices)
          
          const track = (videoRef.current?.srcObject as MediaStream)?.getVideoTracks()[0]
          if (track) {
            const currentDevice = videoDevices.find(d => d.label === track.label)
            if (currentDevice) setActiveCameraId(currentDevice.deviceId)
            else if (videoDevices.length > 0) setActiveCameraId(videoDevices[0].deviceId)
          }
        } catch (e) {
          console.error("Error enumerating devices", e)
        }

        // Load necklace image
        const necklaceImg = new window.Image()
        // Initialize directly with the currently selected product
        necklaceImg.src = selectedProduct
        necklaceImageRef.current = necklaceImg

        // Wait for necklace image to load
        await new Promise((resolve, reject) => {
          necklaceImg.onload = resolve
          necklaceImg.onerror = () => {
            // Fallback to remote URL if local file is missing
            if (necklaceImg.src.includes('localhost') || necklaceImg.src.startsWith('/')) {
              console.warn(`Local image missing: ${necklaceImg.src}. Falling back to remote image.`)
              necklaceImg.onerror = () => reject(new Error('Failed to load both local and fallback images.'))
              necklaceImg.src = REMOTE_FALLBACK
            } else {
              reject(new Error(`Failed to load image: ${necklaceImg.src}`))
            }
          }
        })

        // Start AR rendering
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          const dpr = window.devicePixelRatio || 1
          canvas.width = Math.floor(window.innerWidth * dpr)
          canvas.height = Math.floor(window.innerHeight * dpr)

          let lastVideoTime = -1;
          let lastDetectionResult: any = null;
          let lastHandDetectionResult: any = null;
          let lastPoseDetectionResult: any = null;

          const animate = () => {
            if (!videoRef.current || !canvas) {
              requestAnimationFrame(animate)
              return
            }

            const video = videoRef.current
            if (video.readyState >= 2) { // HAVE_CURRENT_DATA
              if (video.videoWidth === 0 || video.videoHeight === 0) {
                requestAnimationFrame(animate)
                return
              }

              const dpr = window.devicePixelRatio || 1
              const logicalWidth = window.innerWidth
              const logicalHeight = window.innerHeight

              // Handle window resize dynamically to support high-DPI displays
              if (canvas.width !== Math.floor(logicalWidth * dpr) || canvas.height !== Math.floor(logicalHeight * dpr)) {
                canvas.width = Math.floor(logicalWidth * dpr)
                canvas.height = Math.floor(logicalHeight * dpr)
                if (ctx) {
                  ctx.imageSmoothingEnabled = true
                  ctx.imageSmoothingQuality = 'high'
                }
              }

              // Calculate object-fit cover dimensions
              const videoRatio = video.videoWidth / video.videoHeight
              const canvasRatio = logicalWidth / logicalHeight
              let drawWidth = logicalWidth
              let drawHeight = logicalHeight
              let offsetX = 0
              let offsetY = 0

              if (videoRatio > canvasRatio) {
                drawWidth = logicalHeight * videoRatio
                offsetX = (logicalWidth - drawWidth) / 2
              } else {
                drawHeight = logicalWidth / videoRatio
                offsetY = (logicalHeight - drawHeight) / 2
              }

              ctx.clearRect(0, 0, canvas.width, canvas.height)

              ctx.save() // Scale for High DPI displays
              ctx.scale(dpr, dpr)

              // Draw video (mirror only if front camera)
              ctx.save()
              if (facingModeRef.current === 'user') {
                ctx.translate(logicalWidth, 0)
                ctx.scale(-1, 1)
                ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)
              } else {
                ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)
              }
              ctx.restore()

              // Detect faces only when there is a new frame to save performance
              if (video.currentTime !== lastVideoTime) {
                lastVideoTime = video.currentTime
                lastDetectionResult = faceLandmarker.detectForVideo(video, performance.now())
                if (handDetectionRef.current) {
                  lastHandDetectionResult = handDetectionRef.current.detectForVideo(video, performance.now())
                }
                if (poseDetectionRef.current) {
                  lastPoseDetectionResult = poseDetectionRef.current.detectForVideo(video, performance.now())
                }
              }

              const isUser = facingModeRef.current === 'user'
              const mapX = (x: number) => {
                const rawX = offsetX + x * drawWidth
                return isUser ? logicalWidth - rawX : rawX
              }
              const mapY = (y: number) => offsetY + y * drawHeight

              const isHandItem = selectedCategory === 'ring'
              const isPoseItem = selectedCategory === 'bangle'

              if (isHandItem && lastHandDetectionResult && lastHandDetectionResult.landmarks && lastHandDetectionResult.landmarks.length > 0) {
                const handLandmarks = lastHandDetectionResult.landmarks[0]

                // Only draw if the image is fully loaded to prevent NaN dimensions
                if (necklaceImageRef.current && necklaceImageRef.current.complete && necklaceImageRef.current.naturalWidth > 0) {
                  if (selectedCategory === 'ring') {
                    // Ring placement on Ring Finger (MCP: 13, PIP: 14)
                    const mcp = handLandmarks[13]
                    const pip = handLandmarks[14]
                    
                    const mcpX = mapX(mcp.x)
                    const mcpY = mapY(mcp.y)
                    const pipX = mapX(pip.x)
                    const pipY = mapY(pip.y)
                    
                    const fingerLength = Math.hypot(pipX - mcpX, pipY - mcpY)
                    const itemWidth = fingerLength * 0.4
                    const itemHeight = (necklaceImageRef.current.naturalHeight / necklaceImageRef.current.naturalWidth) * itemWidth
                    
                    const midX = (mcpX + pipX) / 2
                    const midY = (mcpY + pipY) / 2
                    const angle = Math.atan2(pipY - mcpY, pipX - mcpX)
                    
                    ctx.save()
                    ctx.translate(midX, midY)
                    ctx.rotate(angle - Math.PI / 2) // Orient ring horizontally across the finger
                    ctx.globalAlpha = 0.95
                    ctx.drawImage(
                      necklaceImageRef.current,
                      -itemWidth / 2,
                      -itemHeight / 2,
                      itemWidth,
                      itemHeight
                    )
                    ctx.restore()
                  }
                }
              } else if (isPoseItem && lastPoseDetectionResult && lastPoseDetectionResult.landmarks && lastPoseDetectionResult.landmarks.length > 0) {
                const poseLandmarks = lastPoseDetectionResult.landmarks[0]
                
                if (necklaceImageRef.current && necklaceImageRef.current.complete && necklaceImageRef.current.naturalWidth > 0) {
                  const drawBangleOnArm = (p1: any, p2: any, stateRef: any) => {
                    if (!p1 || !p2) {
                      stateRef.current = null;
                      return;
                    }
                    // Don't draw if arm points aren't fully visible
                    if ((p1.visibility && p1.visibility < 0.5) || (p2.visibility && p2.visibility < 0.5)) {
                      stateRef.current = null;
                      return;
                    }

                    const p1X = mapX(p1.x)
                    const p1Y = mapY(p1.y)
                    const p2X = mapX(p2.x)
                    const p2Y = mapY(p2.y)

                    // Position between elbow (p1) and wrist (p2)
                    // Using 0.2/0.8 keeps it slightly closer to the wrist for a natural bangle look
                    let midX = p1X * 0.2 + p2X * 0.8
                    let midY = p1Y * 0.2 + p2Y * 0.8
                    
                    const armLength = Math.hypot(p2X - p1X, p2Y - p1Y)
                    let itemWidth = armLength * 0.4
                    let angle = Math.atan2(p2Y - p1Y, p2X - p1X)
                    
                    // Exponential Moving Average (EMA) for stability
                    let smoothing = 0.6; // Increased for faster baseline tracking
                    if (stateRef.current) {
                      const prev = stateRef.current;
                      
                      // Dynamic smoothing: eliminate lag when the arm moves very fast
                      const dist = Math.hypot(midX - prev.x, midY - prev.y);
                      if (dist > 40) smoothing = 0.9; // Snap instantly on large movements
                      
                      midX = prev.x + (midX - prev.x) * smoothing;
                      midY = prev.y + (midY - prev.y) * smoothing;
                      itemWidth = prev.width + (itemWidth - prev.width) * smoothing;
                      
                      // Shortest path angle interpolation
                      let angleDiff = angle - prev.angle;
                      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                      angle = prev.angle + angleDiff * smoothing;
                    }
                    stateRef.current = { x: midX, y: midY, width: itemWidth, angle: angle };

                    const itemHeight = (necklaceImageRef.current.naturalHeight / necklaceImageRef.current.naturalWidth) * itemWidth
                    
                    ctx.save()
                    ctx.translate(midX, midY)
                    // Align rotation directly with the arm's angle
                    ctx.rotate(angle) 
                    ctx.globalAlpha = 0.95
                    ctx.drawImage(
                      necklaceImageRef.current,
                      -itemWidth / 2,
                      -itemHeight / 2,
                      itemWidth,
                      itemHeight
                    )
                    ctx.restore()
                  }

                  // Left Arm: 13 (Elbow) and 15 (Wrist)
                  drawBangleOnArm(poseLandmarks[13], poseLandmarks[15], smoothedBangleLeftRef)
                  
                  // Right Arm: 14 (Elbow) and 16 (Wrist)
                  drawBangleOnArm(poseLandmarks[14], poseLandmarks[16], smoothedBangleRightRef)
                }
              } else if (!isHandItem && !isPoseItem && lastDetectionResult && lastDetectionResult.faceLandmarks && lastDetectionResult.faceLandmarks.length > 0) {
                const landmarks = lastDetectionResult.faceLandmarks[0]

                const leftEye = landmarks[226]
                const rightEye = landmarks[446]
                const chin = landmarks[152] // Bottom of the chin

                const chinX = mapX(chin.x)
                const chinY = mapY(chin.y)
                const leftEyeX = mapX(leftEye.x)
                const leftEyeY = mapY(leftEye.y)
                const rightEyeX = mapX(rightEye.x)
                const rightEyeY = mapY(rightEye.y)
                
                // Robust face angle calculation handling mirrored camera coordinates properly
                const dx = isUser ? leftEyeX - rightEyeX : rightEyeX - leftEyeX
                const dy = isUser ? leftEyeY - rightEyeY : rightEyeY - leftEyeY
                const faceAngle = Math.atan2(dy, dx)

                // Only draw if the image is fully loaded to prevent NaN dimensions
                if (necklaceImageRef.current && necklaceImageRef.current.complete && necklaceImageRef.current.naturalWidth > 0) {
                  // Calculate face width using hypotenuse for robust head tilt handling
                  const faceWidth = Math.hypot(rightEyeX - leftEyeX, rightEyeY - leftEyeY) * 2.5
                  
                  ctx.save()
                  ctx.globalAlpha = 0.95
                  
                  if (selectedCategory === 'earring') {
                    // Left Ear (132) and Right Ear (361)
                    const leftEar = landmarks[132]
                    const rightEar = landmarks[361]
                    const leX = mapX(leftEar.x)
                    const leY = mapY(leftEar.y)
                    const reX = mapX(rightEar.x)
                    const reY = mapY(rightEar.y)

                    const itemWidth = faceWidth * 0.05 // Reduced size further
                    const itemHeight = (necklaceImageRef.current.naturalHeight / necklaceImageRef.current.naturalWidth) * itemWidth

                    // Ear visibility check using FaceMesh Z depth
                    // If the head turns, one ear gets pushed further back (higher Z)
                    const earZDiff = leftEar.z - rightEar.z
                    const leftEarVisible = earZDiff < 0.04
                    const rightEarVisible = earZDiff > -0.04

                    // Vector to push earrings outside the face
                    const earDx = leX - reX
                    const earDy = leY - reY
                    const earDist = Math.hypot(earDx, earDy)
                    const earUx = earDist > 0 ? earDx / earDist : 0
                    const earUy = earDist > 0 ? earDy / earDist : 0
                    
                    const pushOffset = faceWidth * 0.03 // Distance to push away from cheeks

                    // Draw Left Earring
                    if (leftEarVisible) {
                      ctx.save()
                      ctx.translate(leX + earUx * pushOffset, leY + earUy * pushOffset)
                      ctx.rotate(faceAngle) // Align perfectly vertical to the face
                      ctx.drawImage(necklaceImageRef.current, -itemWidth / 2, -itemHeight / 2, itemWidth, itemHeight)
                      ctx.restore()
                    }

                    // Draw Right Earring
                    if (rightEarVisible) {
                      ctx.save()
                      ctx.translate(reX - earUx * pushOffset, reY - earUy * pushOffset)
                      ctx.rotate(faceAngle) // Align perfectly vertical to the face
                      ctx.scale(-1, 1) // Mirror the earring horizontally for proper symmetry on the other ear
                      ctx.drawImage(necklaceImageRef.current, -itemWidth / 2, -itemHeight / 2, itemWidth, itemHeight)
                      ctx.restore()
                    }

                  } else if (selectedCategory === 'mookuthi') {
                    // Nose placement (Switching to 358 for opposite side)
                    const nostril = landmarks[358]
                    const nX = mapX(nostril.x)
                    const nY = mapY(nostril.y)
                    
                    const itemWidth = faceWidth * 0.06 // Reduced size
                    const itemHeight = (necklaceImageRef.current.naturalHeight / necklaceImageRef.current.naturalWidth) * itemWidth
                    
                    ctx.save()
                    ctx.translate(nX, nY)
                    ctx.rotate(faceAngle)
                    ctx.drawImage(necklaceImageRef.current, -itemWidth / 2, -itemHeight / 2, itemWidth, itemHeight)
                    ctx.restore()

                  } else if (selectedCategory === 'nethichutti') {
                    // Forehead center: 10
                    const forehead = landmarks[10]
                    const fX = mapX(forehead.x)
                    const fY = mapY(forehead.y)
                    
                    const itemWidth = faceWidth * 0.40
                    const itemHeight = (necklaceImageRef.current.naturalHeight / necklaceImageRef.current.naturalWidth) * itemWidth
                    
                    ctx.save()
                    ctx.translate(fX, fY)
                    ctx.rotate(faceAngle) // Align perfectly vertical to the face
                    ctx.drawImage(necklaceImageRef.current, -itemWidth / 2, -itemHeight / 2, itemWidth, itemHeight)
                    ctx.restore()

                  } else {
                    // Default to Necklace logic
                    let itemWidth = faceWidth * 1.3
                    let yOffset = 0.1
                    
                    const itemHeight = (necklaceImageRef.current.naturalHeight / necklaceImageRef.current.naturalWidth) * itemWidth
    
                    const itemX = chinX - itemWidth / 2
                    const itemY = chinY + itemHeight * yOffset
    
                    ctx.drawImage(
                      necklaceImageRef.current,
                      itemX,
                      itemY,
                      itemWidth,
                      itemHeight
                    )
                  }
                  
                  ctx.restore()
                }
              }

              ctx.restore() // Restore High DPI scale
            }

            requestAnimationFrame(animate)
          }

          animate()
        }
      } catch (error: any) {
        let errorMsg = error?.message || String(error)
        
        // MediaPipe injects a <script> tag for WASM. If missing, it throws a DOM Event which prints as {}
        if (error && typeof error === 'object') {
          if (error.type === 'error' && error.target?.src) {
            errorMsg = `Failed to load MediaPipe WASM file from: ${error.target.src}. Please check your public/mediapipe/wasm folder.`
          } else if (Object.keys(error).length === 0 && !(error instanceof Error)) {
            errorMsg = 'Network or missing file error. Ensure WASM and model files are placed in the public directory.'
          }
        }

        console.error('AR initialization error:', errorMsg, error)
        if (error?.name === 'NotAllowedError') {
          setPermissionState('denied')
        } else {
          alert(`AR initialization failed:\n\n${errorMsg}`)
          setPermissionState('denied')
        }
      }
    }

    initAR()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [startStream, appState])

  if (appState === 'splash') {
    return (
      <div className="fixed inset-0 bg-black cursor-pointer" onClick={() => setAppState('options')}>
        <Image src={frontImage} alt="Welcome" fill className="object-cover" priority />
      </div>
    )
  }

  if (appState === 'options') {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-8 text-black">Select Category</h1>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {productCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id)
                setAppState('catalog')
              }}
              className="p-4 border border-gray-200 rounded-xl shadow-sm text-lg font-medium bg-white text-black hover:bg-gray-50 transition"
            >
              {category.label}
            </button>
          ))}
          <button
            onClick={() => alert('Collection view is under construction.')}
            className="p-4 border border-gray-200 rounded-xl shadow-sm text-lg font-medium bg-white text-black hover:bg-gray-50 transition"
          >
            Collection
          </button>
        </div>
      </div>
    )
  }

  if (appState === 'catalog') {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="flex items-center p-4 border-b border-gray-100 shadow-sm sticky top-0 bg-white z-10">
          <button onClick={() => setAppState('options')} className="mr-4 p-2 rounded-full hover:bg-gray-100 transition">
            <ChevronLeft className="h-6 w-6 text-black" />
          </button>
          <h1 className="text-xl font-bold capitalize text-black">{productCategories.find(c => c.id === selectedCategory)?.label || selectedCategory} Catalog</h1>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          {isLoadingCatalog ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 className="h-10 w-10 animate-spin mb-4" />
              <p>Loading products...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {products[selectedCategory as string]?.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product.src)
                    setAppState('detail')
                  }}
                  className="border border-gray-200 rounded-xl p-3 flex flex-col items-center shadow-sm hover:shadow-md transition bg-white text-black"
                >
                  <div className="w-full h-40 mb-3 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden">
                    <img 
                      src={product.src} 
                      alt={product.name} 
                      className="h-32 object-contain" 
                      onError={(e) => {
                        if (!e.currentTarget.src.includes('vercel-storage.com')) {
                          e.currentTarget.src = REMOTE_FALLBACK;
                        }
                      }}
                    />
                  </div>
                  <span className="font-semibold text-sm text-center">{product.name}</span>
                  {product.weight && (
                    <span className="text-xs text-gray-500 mt-1">{product.weight}g</span>
                  )}
                </button>
              ))}
              {(!products[selectedCategory as string] || products[selectedCategory as string].length === 0) && (
                <p className="col-span-2 text-center text-gray-500 py-10">No products available in this category.</p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (appState === 'detail') {
    return (
      <div className="fixed inset-0 bg-white flex flex-col">
        <button onClick={() => setAppState('catalog')} className="absolute top-6 left-6 z-10 p-3 bg-white border border-gray-200 rounded-full shadow-md hover:bg-gray-50 transition">
          <ChevronLeft className="h-6 w-6 text-black" />
        </button>
        <div className="flex-1 flex items-center justify-center bg-gray-50 p-8">
          <img 
            src={selectedProduct} 
            alt="Product Detail" 
            className="max-w-full max-h-full object-contain drop-shadow-xl" 
            onError={(e) => {
              if (!e.currentTarget.src.includes('vercel-storage.com')) {
                e.currentTarget.src = REMOTE_FALLBACK;
              }
            }}
          />
        </div>
        <button onClick={() => setAppState('ar')} className="absolute bottom-8 right-8 bg-black text-white px-8 py-4 rounded-full font-bold shadow-xl flex items-center gap-2 hover:bg-gray-800 transition transform hover:scale-105">
          View in AR
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
        autoPlay
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      
      {permissionState === 'granted' && (
        <>
          {/* Bottom Left Camera Options Button */}
          <div className="absolute bottom-8 left-8 z-50 flex flex-col items-start gap-4">
            {showCameraOptions && cameras.length > 0 && (
              <div className="bg-white/90 backdrop-blur-md rounded-xl p-2 shadow-lg flex flex-col gap-2 min-w-[200px] mb-2">
                {cameras.map((camera, index) => (
                  <button
                    key={camera.deviceId}
                    onClick={async () => {
                      setShowCameraOptions(false);
                      if (activeCameraId === camera.deviceId || isSwitching) return;
                      setIsSwitching(true);
                      setActiveCameraId(camera.deviceId);
                      // Only apply mirroring heuristics for typical front-facing/user camera labels
                      facingModeRef.current = camera.label.toLowerCase().includes('front') || camera.label.toLowerCase().includes('user') ? 'user' : 'environment';
                      try {
                        await startStream(camera.deviceId);
                      } catch (err) {
                        console.error("Failed to switch to selected camera", err);
                      } finally {
                        setIsSwitching(false);
                      }
                    }}
                    className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeCameraId === camera.deviceId 
                        ? 'bg-black text-white' 
                        : 'text-black hover:bg-black/10'
                    }`}
                  >
                    {camera.label || `Camera ${index + 1}`}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowCameraOptions(!showCameraOptions)}
              disabled={isSwitching}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white/30 active:scale-95 shadow-lg disabled:opacity-50"
              aria-label="Camera Options"
            >
              <SwitchCamera className="h-7 w-7" />
            </button>
          </div>
          
          {/* Bottom Right Product Options Button */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="absolute bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all hover:bg-white/30 active:scale-95 shadow-lg"
                aria-label="Product Options"
              >
                <Menu className="h-7 w-7" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white/90 backdrop-blur-xl border-l-white/20">
              <SheetHeader>
                <SheetTitle>
                  {selectedCategory ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedCategory(null)} 
                        className="hover:bg-gray-100 dark:hover:bg-gray-800 p-1.5 rounded-full transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      {productCategories.find(c => c.id === selectedCategory)?.label} Catalog
                    </div>
                  ) : (
                    'Product Categories'
                  )}
                </SheetTitle>
                <SheetDescription>
                  {selectedCategory ? 'Select a product to try on.' : 'Select a jewelry category to view products.'}
                </SheetDescription>
              </SheetHeader>
              <div className="py-6 overflow-y-auto h-[calc(100vh-120px)]">
                {!selectedCategory ? (
                  <div className="flex flex-col gap-3">
                    {productCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className="w-full p-4 border rounded-lg text-left font-medium transition-colors bg-transparent text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800"
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {isLoadingCatalog ? (
                      <div className="col-span-2 flex flex-col items-center justify-center py-12 text-gray-500">
                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                        <p>Loading products...</p>
                      </div>
                    ) : (
                      <>
                        {products[selectedCategory as string]?.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => setSelectedProduct(product.src)}
                            className={`border rounded-lg p-3 flex flex-col items-center transition ${selectedProduct === product.src ? 'bg-primary/10 border-primary shadow-sm' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                          >
                            <div className="w-full h-24 rounded-md mb-3 flex items-center justify-center bg-black/5 dark:bg-white/5 overflow-hidden">
                              <img 
                                src={product.src} 
                                alt={product.name} 
                                className="h-16 object-contain" 
                                onError={(e) => {
                                  if (!e.currentTarget.src.includes('vercel-storage.com')) {
                                    e.currentTarget.src = REMOTE_FALLBACK;
                                  }
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium text-center">{product.name}</span>
                            {product.weight && (
                              <span className="text-xs text-gray-500 mt-1 font-semibold">{product.weight}g</span>
                            )}
                          </button>
                        ))}
                        {(!products[selectedCategory as string] || products[selectedCategory as string].length === 0) && (
                          <p className="col-span-2 text-center text-gray-500 py-4">No products available in this category.</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
      
      {/* Center Screen Output while Switching Camera */}
      {isSwitching && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
          <Loader2 className="h-12 w-12 animate-spin text-white mb-4" />
          <p className="text-white font-medium text-lg drop-shadow-md">Switching Camera...</p>
        </div>
      )}

      {permissionState === 'pending' && (
        <div className="fixed inset-0 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="flex justify-center">
              <Image src={companyLogo} alt="Company Logo" width={250} height={250} className="object-contain brightness-0" />
            </div>
          </div>
        </div>
      )}
      
      {permissionState === 'denied' && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white max-w-sm">
            <div className="flex justify-center mb-6">
              <Image src={companyLogo} alt="Company Logo" width={120} height={120} className="object-contain invert brightness-0" />
            </div>
            <p className="text-lg font-medium mb-4">Camera Access Required</p>
            <p className="text-sm text-gray-400 mb-6">
              Please enable camera permissions in your browser settings to use the AR necklace try-on.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
