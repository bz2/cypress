import _ from 'lodash'
import sinon from 'sinon'

import scroller from './scroller'

const getContainer = (props) => {
  return _.extend({
    clientHeight: 400,
    scrollHeight: 900,
    scrollTop: 0,
    addEventListener: sinon.spy(),
  }, props)
}

const getElement = (props) => {
  return _.extend({
    clientHeight: 20,
    offsetTop: 150,
  }, props)
}

describe('scroller', () => {
  let clock

  beforeEach(() => {
    clock = sinon.useFakeTimers()
  })

  beforeEach(() => {
    scroller.__reset()
  })

  it('throws an error if attempting to scroll an element before setting a container', () => {
    expect(() => {
      return scroller.scrollIntoView({})
    }).to.throw(/container must be set/)
  })

  it('does not scroll if near top and scrolling would result in negative scroll', () => {
    const container = getContainer()

    scroller.setContainer(container)
    scroller.scrollIntoView(getElement({ offsetTop: 0 }))
    expect(container.scrollTop).to.equal(0)
  })

  it('does not scroll if already full visible', () => {
    const container = getContainer()

    scroller.setContainer(container)
    scroller.scrollIntoView(getElement({ offsetTop: 80 }))
    expect(container.scrollTop).to.equal(0)
  })

  it('scrolls to the goal', () => {
    const container = getContainer({ scrollTop: 50 })

    scroller.setContainer(container)
    scroller.scrollIntoView(getElement({ offsetTop: 600 }))
    expect(container.scrollTop).to.equal(320)
  })

  context('#getScrollTop', () => {
    it('returns the current scrollTop for the container', () => {
      scroller.setContainer(getContainer({ scrollTop: 123 }))
      expect(scroller.getScrollTop()).to.equal(123)
    })

    it('returns 0 if the container is not set', () => {
      expect(scroller.getScrollTop()).to.equal(0)
    })
  })

  context('#setScrollTop', () => {
    it('sets the scrollTop on the container', () => {
      scroller.setContainer(getContainer({ scrollTop: 123 }))
      scroller.setScrollTop(456)
      expect(scroller.getScrollTop()).to.equal(456)
    })

    it('does nothing if container is not set', () => {
      scroller.setScrollTop(456)
      expect(scroller.getScrollTop()).to.equal(0)
    })

    it('does nothing if value is null', () => {
      scroller.setContainer(getContainer({ scrollTop: 123 }))
      scroller.setScrollTop(null)
      expect(scroller.getScrollTop()).to.equal(123)
    })

    it('does nothing if value is undefined', () => {
      scroller.setContainer(getContainer({ scrollTop: 123 }))
      scroller.setScrollTop()
      expect(scroller.getScrollTop()).to.equal(123)
    })
  })

  context('scrolling', () => {
    it('listens to scroll event on container', () => {
      const container = getContainer()

      scroller.setContainer(container)
      expect(container.addEventListener).to.have.been.calledWith('scroll')
    })

    it('calls onUserScroll callback if 3 or more user scroll events are detected within 50ms', () => {
      const container = getContainer()
      const onUserScroll = sinon.spy()

      scroller.setContainer(container, onUserScroll)
      container.addEventListener.callArg(1)
      clock.tick(15)
      container.addEventListener.callArg(1)
      clock.tick(15)
      container.addEventListener.callArg(1)
      expect(onUserScroll).to.have.been.called
    })

    it('does nothing if 50ms passes before 3 user scroll events', () => {
      const container = getContainer()
      const onUserScroll = sinon.spy()

      scroller.setContainer(container, onUserScroll)
      container.addEventListener.callArg(1)
      container.addEventListener.callArg(1)
      clock.tick(50)
      container.addEventListener.callArg(1)
      expect(onUserScroll).not.to.have.been.called
    })

    it('does nothing for programmatic scroll events', () => {
      const container = getContainer()
      const onUserScroll = sinon.spy()

      scroller.setContainer(container, onUserScroll)
      scroller.scrollIntoView(getElement({ offsetTop: 600 }))
      clock.tick(16)
      container.addEventListener.callArg(1)
      clock.tick(16)
      container.addEventListener.callArg(1)
      clock.tick(16)
      container.addEventListener.callArg(1)
      expect(onUserScroll).not.to.have.been.called
    })
  })
})
