/* @flow */

import { isObject, isDef } from 'core/util/index'
import { updateVnodeToMP } from '../instance/index'

/**
 * Runtime helper for rendering v-for lists.
 */
export function afterRenderList (
  val: any,
  render: (
    val: any,
    keyOrIndex: string | number,
    index?: number
  ) => VNode,
  forId: string | number,
  context: Vue,
  ret: Array<VNode>
) {
  updateListToMP(ret, val, forId, context)
}

// TODO: support for destructuring
function updateListToMP (vnodeList, val, forId, context) {
  const firstItem = vnodeList[0]
  let forKeys
  let list = []
  /* istanbul ignore else */
  if (firstItem) {
    // collect v-key
    if (Array.isArray(firstItem)) {
      forKeys = firstItem.map(e => {
        const { attrs = {}} = e.data || /* istanbul ignore next */ {}
        const { _fk = '' } = attrs
        return _fk
      })
    } else {
      const { attrs = {}} = firstItem.data || {}
      const { _fk = '' } = attrs
      forKeys = [_fk]
    }

    forKeys = forKeys.filter(e => e)

    // generate list array with v-key value
    let valToList = []
    /* istanbul ignore else */
    if (Array.isArray(val) || typeof val === 'string') {
      valToList = new Array(val.length)
      for (let i = 0, l = val.length; i < l; i++) {
        valToList[i] = val[i]
      }
    } else if (typeof val === 'number') {
      valToList = new Array(val)
      for (let i = 0; i < val; i++) {
        valToList[i] = i
      }
    } else if (isObject(val)) {
      valToList = Object.keys(val).map((e, i) => i)
    }

    list = valToList.map((e, i) => {
      if (forKeys.length === 0) {
        return i
      }
      return forKeys.reduce((res, k) => {
        res[k.replace(/\./g, '_')] = getValue(val[i], k)
        return res
      }, {})
    })
  }

  const cloneVnode = {
    context,
    data: {
      attrs: { _hid: forId }
    }
  }

  // TODO: try not disable key diff in patching process
  // key will reuse existing vnode which won't update the vnode content
  // see unit test: with key
  // list won't update after this.list.reverse() if it's not disable
  vnodeList.forEach(vnode => {
    if (Array.isArray(vnode)) {
      vnode.forEach(c => {
        if (c.key) c.key = undefined
      })
    } else if (vnode.key) {
      vnode.key = undefined
    }
  })

  updateVnodeToMP(cloneVnode, 'li', list)
}

function getValue (obj = {}, path = '') {
  const paths = path.split('.')
  return paths.reduce((prev, k) => {
    /* istanbul ignore if */
    if (prev && isDef(prev)) {
      prev = prev[k]
    }
    return prev
  }, obj)
}